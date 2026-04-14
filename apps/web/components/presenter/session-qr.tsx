"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card } from "#/components/ui/card";

export function SessionQR({ url }: { url: string }): React.ReactElement {
  return (
    <Card>
      <h3 className="text-sm font-semibold">Reader-Link</h3>
      <p className="mt-1 break-all text-xs text-navy-400">{url}</p>
      <div className="mt-4 flex justify-center rounded-card bg-white p-4">
        <QRCodeSVG value={url} size={192} level="M" />
      </div>
    </Card>
  );
}
