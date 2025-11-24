"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TH, TD } from "@/components/ui/table";
import api from "@/lib/api";

const template = `id,name,category,price,unit,stockQty,imageUrl,active
,Chocolate Cake,Cakes,150,pcs,10,https://example.com/cake.jpg,true`;

export default function ProductsImportPage() {
  const [csv, setCsv] = useState(template);
  const [preview, setPreview] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string>("template.csv");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const parsePreview = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 6);
    const rows = lines.map((l) => l.split(","));
    setPreview(rows);
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setFileName(file.name);
    parsePreview(text);
  };

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmImport = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await api.importProducts(csv);
      setResult(`นำเข้าสำเร็จ: products +${res.insertedProducts}/${res.updatedProducts} | items +${res.insertedItems}/${res.updatedItems}`);
    } catch (err: any) {
      setResult(`เกิดข้อผิดพลาด: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">CSV Import</p>
          <h1 className="text-2xl font-extrabold text-slate-900">Products Import</h1>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          Download Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <input type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
          <textarea
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-xs"
            rows={8}
            value={csv}
            onChange={(e) => {
              setCsv(e.target.value);
              parsePreview(e.target.value);
            }}
          />
          <Button onClick={confirmImport} disabled={loading}>
            {loading ? "Importing..." : "Import now"}
          </Button>
          {result && <div className="text-sm text-slate-800">{result}</div>}
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview ({fileName})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                  {preview[0].map((h, idx) => (
                    <TH key={idx}>{h}</TH>
                  ))}
                </tr>
              </THead>
              <TBody>
                {preview.slice(1).map((row, idx) => (
                  <tr key={idx}>
                    {row.map((cell, cidx) => (
                      <TD key={cidx}>{cell}</TD>
                    ))}
                  </tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
