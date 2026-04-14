"""
SSH deployment helper — primitives shared by the 01_bootstrap / 02_upload /
03_run scripts.

All credentials are read from the local environment. Nothing is stored in
this file or written into the repo:

    DEPLOY_HOST  — hostname or IP of the VServer
    DEPLOY_USER  — SSH user (usually `root` or your sudoer)
    DEPLOY_PASS  — SSH password

SSH-key authentication is preferred for production. To switch, set
`DEPLOY_USE_KEY=1` and paramiko will pick up your default agent / key files.

Exposed helpers
---------------
    sh(cmd, strict=True)        remote shell command, streams output
    put_str(remote, content)    write a small string to a remote file
    upload_tar(local, remote)   tar-pipe upload (much faster than SFTP per file)
"""
from __future__ import annotations

import io
import os
import sys
import tarfile
import time
from pathlib import Path

import paramiko


def _env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise SystemExit(f"[!] required env var missing: {name}")
    return val


EXCLUDE_DIR_NAMES = {
    "node_modules",
    ".next",
    ".turbo",
    ".pnpm-store",
    ".convex",
    "_generated",
    ".git",
    ".deploy",
    "__pycache__",
}
EXCLUDE_FILE_NAMES = {".DS_Store", "Thumbs.db"}


_client: paramiko.SSHClient | None = None


def client() -> paramiko.SSHClient:
    global _client
    if _client is not None:
        return _client
    host = _env("DEPLOY_HOST")
    user = _env("DEPLOY_USER")
    use_key = os.environ.get("DEPLOY_USE_KEY") == "1"

    c = paramiko.SSHClient()
    # AutoAdd is acceptable for first-time bootstrap against a fresh VPS.
    # Pin the fingerprint in known_hosts once you've verified it.
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    if use_key:
        c.connect(host, username=user, timeout=30)
    else:
        c.connect(
            host,
            username=user,
            password=_env("DEPLOY_PASS"),
            allow_agent=False,
            look_for_keys=False,
            timeout=30,
        )
    _client = c
    return _client


def sh(
    cmd: str,
    ok_codes: tuple[int, ...] = (0,),
    label: str | None = None,
    strict: bool = True,
) -> str:
    """Run a remote shell command, stream output, return combined stdout.

    With `strict=True` we wrap the command in `set -e` so the first failure
    aborts the pipeline. Use `strict=False` for exploratory probes where a
    non-zero exit is acceptable.
    """
    print(f"\n$ {label or cmd[:200]}", flush=True)
    chan = client().get_transport().open_session()
    chan.set_combine_stderr(True)
    full = f"set -e; {cmd}" if strict else cmd
    chan.exec_command(full)
    out_chunks: list[str] = []
    while True:
        if chan.recv_ready():
            data = chan.recv(65536).decode("utf-8", "replace")
            sys.stdout.write(data)
            sys.stdout.flush()
            out_chunks.append(data)
        if chan.exit_status_ready() and not chan.recv_ready():
            break
        time.sleep(0.05)
    rc = chan.recv_exit_status()
    if rc not in ok_codes:
        raise SystemExit(f"\n[!] command failed (rc={rc}): {cmd[:200]}")
    return "".join(out_chunks)


def put_str(remote_path: str, content: str, mode: int = 0o644) -> None:
    sftp = client().open_sftp()
    parent = os.path.dirname(remote_path)
    if parent:
        sh(f"mkdir -p {parent}", label=f"mkdir -p {parent}")
    with sftp.file(remote_path, "w") as f:
        f.write(content)
    sftp.chmod(remote_path, mode)
    sftp.close()
    print(f"[+] wrote {remote_path} ({len(content)} bytes)")


def _walk(local_root: Path):
    for root, dirs, files in os.walk(local_root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIR_NAMES]
        for f in files:
            if f in EXCLUDE_FILE_NAMES:
                continue
            full = Path(root) / f
            yield full, full.relative_to(local_root).as_posix()


def upload_tar(local_root: Path, remote_dest_dir: str) -> None:
    """Tar the project locally (in-memory), stream to `tar -x` on remote."""
    print(f"[*] tar-uploading {local_root} -> {remote_dest_dir}", flush=True)
    sh(f"mkdir -p {remote_dest_dir}", label=f"mkdir {remote_dest_dir}")

    buf = io.BytesIO()
    file_count = 0
    with tarfile.open(fileobj=buf, mode="w:gz") as tf:
        for full, rel in _walk(local_root):
            tf.add(str(full), arcname=rel)
            file_count += 1
    buf.seek(0)
    data = buf.getvalue()
    print(f"[*] tarball: {file_count} files, {len(data) // 1024} KiB")

    chan = client().get_transport().open_session()
    chan.exec_command(f"tar -xzf - -C {remote_dest_dir}")
    chan.sendall(data)
    chan.shutdown_write()
    while not chan.exit_status_ready():
        if chan.recv_stderr_ready():
            sys.stderr.write(chan.recv_stderr(8192).decode("utf-8", "replace"))
        time.sleep(0.05)
    rc = chan.recv_exit_status()
    if rc != 0:
        raise SystemExit(f"[!] remote untar failed: rc={rc}")
    print(f"[+] uploaded & extracted {file_count} files to {remote_dest_dir}")
