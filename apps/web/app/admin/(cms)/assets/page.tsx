import type { Metadata } from "next";
import { adminApi } from "@/lib/server-api";
import { AssetRow } from "@/components/admin/AssetRow";

export const metadata: Metadata = { title: "Assets" };

export default async function AdminAssets() {
  const res = await adminApi.getAssets();
  const assets = res?.data ?? [];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
        <p className="mt-1 text-sm text-slate-500">Manage CV, profile image, and Open Graph image</p>
      </div>

      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-400">
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
