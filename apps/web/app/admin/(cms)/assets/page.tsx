import type { Metadata } from "next";
import { adminApi } from "@/lib/server-api";
import { AssetRow } from "@/components/admin/AssetRow";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = { title: "Assets" };

export default async function AdminAssets() {
  const res = await adminApi.getAssets();
  const assets = res?.data ?? [];

  return (
    <div className="admin-page">
      <AdminPageHeader title="Assets" description={`${assets.length} site asset${assets.length === 1 ? "" : "s"}`} />

      {assets.length === 0 ? (
        <div className="admin-empty">
          No assets configured yet.
        </div>
      ) : (
        <div className="space-y-4">
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
