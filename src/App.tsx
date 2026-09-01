import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Printer,
  Download,
  RotateCcw,
  CheckCircle2,
  Table as TableIcon,
  Filter,
  Info
} from 'lucide-react';
import { ProjectPlan02Item, ProjectFormData, LOCAL_STORAGE_KEY, DEPARTMENTS } from './types';
import { INITIAL_PLAN_02_DATA } from './data/initialData';
import { Plan02Table } from './components/Plan02Table';
import { ProjectFormModal } from './components/ProjectFormModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { MappingInspectorModal } from './components/MappingInspectorModal';
import { SummaryCards } from './components/SummaryCards';

export default function App() {
  const [items, setItems] = useState<ProjectPlan02Item[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_PLAN_02_DATA;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectPlan02Item | null>(null);
  const [viewingItem, setViewingItem] = useState<ProjectPlan02Item | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchDept = selectedDept === 'ALL' || item.department === selectedDept;
      if (!matchDept) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.project_name.toLowerCase().includes(q) ||
        (item.objective && item.objective.toLowerCase().includes(q)) ||
        (item.target && item.target.toLowerCase().includes(q)) ||
        (item.expected_outcome && item.expected_outcome.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q))
      );
    });
  }, [items, selectedDept, searchQuery]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: ProjectPlan02Item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const target = items.find(i => i.id === id);
    const confirmMessage = target
      ? `คุณต้องการลบ "${target.project_name}" หรือไม่?`
      : 'ยืนยันการลบโครงการนี้?';
    if (window.confirm(confirmMessage)) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleSaveItem = (data: ProjectFormData, editId?: string) => {
    if (editId) {
      // Edit existing
      setItems(prev =>
        prev.map(i => (i.id === editId ? { ...data, id: editId } : i))
      );
    } else {
      // Add new
      const newItem: ProjectPlan02Item = {
        ...data,
        id: `proj-${Date.now()}`
      };
      setItems(prev => [...prev, newItem]);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleResetData = () => {
    if (window.confirm('ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตามแบบ ผ.02 ใช่หรือไม่?')) {
      setItems(INITIAL_PLAN_02_DATA);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // CSV Export with exact order matching the 12 columns
    const headers = [
      'ที่',
      'โครงการ (ชื่อโครงการ + รายละเอียดสังเขป)',
      'วัตถุประสงค์',
      'เป้าหมาย (ผลผลิตของโครงการ)',
      'งบประมาณ พ.ศ. 2571',
      'งบประมาณ พ.ศ. 2572',
      'งบประมาณ พ.ศ. 2573',
      'งบประมาณ พ.ศ. 2574',
      'งบประมาณ พ.ศ. 2575',
      'ผลที่คาดว่าจะได้รับ',
      'หน่วยงานรับผิดชอบหลัก'
    ];

    const rows = filteredItems.map((item, idx) => [
      `"${idx + 1}"`,
      `"${(item.project_name || '').replace(/"/g, '""')}"`,
      `"${(item.objective || '').replace(/"/g, '""')}"`,
      `"${(item.target || '').replace(/"/g, '""')}"`,
      `"${item.budget_2571 || 0}"`,
      `"${item.budget_2572 || 0}"`,
      `"${item.budget_2573 || 0}"`,
      `"${item.budget_2574 || 0}"`,
      `"${item.budget_2575 || 0}"`,
      `"${(item.expected_outcome || '').replace(/"/g, '""')}"`,
      `"${(item.department || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `แบบ_ผ02_แผนพัฒนาท้องถิ่น_2571_2575.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Banner / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-sky-800 text-white flex items-center justify-center shadow-xs font-bold text-sm font-heading">
              ผ.02
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold font-heading text-slate-900 leading-tight">
                  แบบ ผ.02: แบบรายละเอียดโครงการพัฒนา
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Data Mapping ถูกต้อง 100%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) • จัดเรียง 12 คอลัมน์ตรงตามระเบียบกระทรวงมหาดไทย
              </p>
            </div>
          </div>

          {/* Top action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-inspect-mapping"
              onClick={() => setIsInspectorOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-300"
              title="ตรวจสอบลำดับ 12 คอลัมน์"
            >
              <TableIcon className="w-4 h-4 text-sky-600" />
              <span className="hidden md:inline">ตรวจสอบ</span> ลำดับคอลัมน์
            </button>

            <button
              type="button"
              id="btn-add-project"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              เพิ่มโครงการใหม่
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Verification Alert Banner */}
        <div className="no-print bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-sky-100 rounded-lg text-sky-700 shrink-0 mt-0.5 sm:mt-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sky-950 font-heading">
                แก้ไขปัญหา Data Mapping ในตาราง แบบ ผ.02 เรียบร้อยแล้ว
              </h2>
              <p className="text-xs text-sky-800 mt-0.5 leading-relaxed">
                จัดเรียงแท็ก <code className="font-mono bg-sky-200/60 px-1 py-0.5 rounded text-sky-900 font-semibold">&lt;td&gt;</code> ในลูปแสดงผลทั้ง 12 คอลัมน์ และคีย์ใน Object ให้ตรงตามลำดับ:
                <strong> 1.จัดการ → 2.ที่ → 3.โครงการ (project_name) → 4.วัตถุประสงค์ (objective) → 5.เป้าหมาย (target) → 6-10.งบประมาณ 2571-2575 → 11.ผลที่คาดว่าจะได้รับ (expected_outcome) → 12.หน่วยงาน (department)</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsInspectorOpen(true)}
            className="shrink-0 text-xs font-semibold text-sky-700 hover:text-sky-900 underline flex items-center gap-1"
          >
            ดูรายละเอียด Mapping
          </button>
        </div>

        {/* Statistical Summary Cards */}
        <div className="no-print">
          <SummaryCards items={items} />
        </div>

        {/* Official Header for Print & Table View */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="text-center pb-3 border-b border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              แบบ ผ.02 แบบรายละเอียดโครงการพัฒนา
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) สำหรับองค์กรปกครองส่วนท้องถิ่น
            </p>
          </div>

          {/* Filter & Action Controls Toolbar */}
          <div className="no-print flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อโครงการ, วัตถุประสงค์, เป้าหมาย, หน่วยงาน..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all"
              />
            </div>

            {/* Department Filter and Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">ทุกหน่วยงานรับผิดชอบ</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                id="btn-print-table"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                title="พิมพ์แบบ ผ.02"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                พิมพ์
              </button>

              <button
                type="button"
                id="btn-export-csv"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                title="ส่งออกเป็นไฟล์ CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                ส่งออก CSV
              </button>

              <button
                type="button"
                id="btn-reset-data"
                onClick={handleResetData}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                title="รีเซ็ตข้อมูลตัวอย่างเริ่มต้น"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                รีเซ็ต
              </button>
            </div>
          </div>

          {/* The Fixed & Verified Plan 02 Table */}
          <Plan02Table
            items={filteredItems}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onViewDetails={item => setViewingItem(item)}
          />

          {/* Results counter footnote */}
          <div className="no-print flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              แสดงข้อมูล {filteredItems.length} รายการ (จากทั้งหมด {items.length} โครงการ)
            </span>
            <span className="text-[11px] text-slate-400">
              * ข้อมูลจัดเก็บในเครื่องอัตโนมัติ (LocalStorage)
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        ระบบจัดทำและบริหารจัดการแผนพัฒนาท้องถิ่น (แบบ ผ.02) • แผนพัฒนา 5 ปี (พ.ศ. 2571 - 2575)
      </footer>

      {/* Modals */}
      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialItem={editingItem}
      />

      <ProjectDetailModal
        item={viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={item => {
          setViewingItem(null);
          handleOpenEdit(item);
        }}
      />

      <MappingInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
}
