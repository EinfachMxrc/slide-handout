#!/usr/bin/env python
import sys, paramiko
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("87.106.117.133", username="root", password="5LlBmC2QX8Dq", timeout=15, allow_agent=False, look_for_keys=False)
cmd = " ".join(sys.argv[1:])
_, stdout, stderr = c.exec_command(cmd, timeout=120)
sys.stdout.write(stdout.read().decode("utf-8", "replace"))
sys.stderr.write(stderr.read().decode("utf-8", "replace"))
sys.exit(stdout.channel.recv_exit_status())
