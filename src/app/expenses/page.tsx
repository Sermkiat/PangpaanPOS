"use client";

import { useEffect, useMemo, useState } from "react";
import { usePosStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TH, TD } from "@/components/ui/table";
import api from "@/lib/api";

const categoryOptions = ["ingredients", "utilities", "labor", "other"];
const paymentOptions = ["cash", "promptpay", "card"];

const monthString = (d: Date) => d.toISOString().slice(0, 7);

export default function ExpensesPage() {
  const { expenses, addExpense, fetchExpenses } = usePosStore();
  const [month, setMonth] = useState(monthString(new Date()));
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "ingredients",
    description: "",
    amount: 0,
    paymentMethod: "cash",
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ date: string; category: string; description: string; amount: number }[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchExpenses(month).catch((err) => console.error("load expenses", err));
  }, [month, fetchExpenses]);

  const monthTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0),
    [expenses],
  );

  const submit = async () => {
    if (!form.description || !form.amount) return;
    await addExpense({
      category: form.category,
      description: form.description,
      amount: Number(form.amount),
      date: form.date,
      paymentMethod: form.paymentMethod,
    });
    fetchExpenses(month);
    setForm({ ...form, description: "", amount: 0 });
  };

  const handleFileSelect = (file?: File | null) => {
    if (!file) {
      setCsvFile(null);
      setCsvPreview([]);
      return;
    }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const header = lines[0]?.split(",") || [];
      const idx = (key: string) => header.findIndex((h) => h.trim().toLowerCase() === key);
      const dateIdx = idx("date");
      const categoryIdx = idx("category");
      const detailIdx = idx("detail");
      const descIdx = idx("description");
      const amountIdx = idx("amount");
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(",");
        const amount = Number((cols[amountIdx] ?? "").trim());
        return {
          date: (cols[dateIdx] ?? "").trim(),
          category: (cols[categoryIdx] ?? "").trim(),
          description: (cols[detailIdx] ?? cols[descIdx] ?? "").trim(),
          amount: Number.isNaN(amount) ? 0 : amount,
        };
      });
      setCsvPreview(rows.filter((r) => r.amount));
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!csvFile) return;
    setImporting(true);
    const text = await csvFile.text();
    await api.importExpenses(text, form.paymentMethod);
    await fetchExpenses(month);
    setCsvPreview([]);
    setCsvFile(null);
    setImporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-orange-700">Track spend</p>
          <h1 className="text-2xl font-extrabold text-orange-950">Expense Log</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>เดือน</span>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Summary</CardTitle>
            <p className="text-xs text-slate-600">ยอดรวมรายจ่ายในเดือนที่เลือก</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Total</div>
            <div className="text-2xl font-bold text-rose-700">฿ {monthTotal.toFixed(2)}</div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add expense</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Input
              placeholder="Description"
              className="md:col-span-2"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={form.amount || ""}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
            />
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
            >
              {paymentOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={submit}>Save expense</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <input type="file" accept=".csv,text/csv" onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
            <p className="text-xs text-slate-600">header: date, category, detail, amount, payment_method</p>
            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-slate-700">พรีวิว {csvPreview.length} รายการแรก</div>
                <Table>
                  <THead>
                    <tr>
                      <TH>Date</TH>
                      <TH>Category</TH>
                      <TH>Description</TH>
                      <TH>Amount</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {csvPreview.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <TD>{row.date}</TD>
                        <TD>{row.category}</TD>
                        <TD>{row.description}</TD>
                        <TD>฿ {row.amount.toFixed(2)}</TD>
                      </tr>
                    ))}
                  </TBody>
                </Table>
                <Button variant="primary" disabled={importing} onClick={confirmImport}>
                  {importing ? "Importing..." : "Import now"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>When</TH>
                <TH>Category</TH>
                <TH>Description</TH>
                <TH>Payment</TH>
                <TH>Amount</TH>
              </tr>
            </THead>
            <TBody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <TD>{new Date(e.date).toLocaleString()}</TD>
                  <TD>{e.category}</TD>
                  <TD>{e.description}</TD>
                  <TD className="capitalize">{e.paymentMethod || "-"}</TD>
                  <TD>฿ {Number(e.amount ?? 0).toFixed(2)}</TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
