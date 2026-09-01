import React, { useState, useEffect } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Zap,
  BookOpen,
  X,
  RefreshCw,
  Send,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Upload,
  Database
} from 'lucide-react';
import { ApiSyncService, GasConfig } from '../services/apiSyncService';
import { StorageService } from '../services/storageService';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshAll?: () => void;
  onShowToast?: (title: string, msg?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * ระบบจัดการแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เทศบาลเมืองศิลา
 * GOOGLE APPS SCRIPT (GAS) BACKEND & GOOGLE SHEETS CONNECTOR (Code.gs)
 * ==============================================================================
 * คำแนะนำการติดตั้ง:
 * 1. เปิด Google Sheets -> เมนู "ส่วนขยาย" (Extensions) -> "Apps Script"
 * 2. ลบโค้ดเดิมทั้งหมดในไฟล์ Code.gs แล้ววางโค้ดชุดนี้ลงไป
 * 3. กำหนดค่า API_SECRET_TOKEN ด้านล่างให้ตรงกับที่ตั้งไว้ในระบบ
 * 4. กดบันทึก (Ctrl + S)
 * 5. เลือกฟังก์ชัน "initialSetup" แล้วกด "เรียกใช้" (Run) เพื่อสร้างตารางอัตโนมัติ
 * 6. กด "ทำให้ใช้งานได้" (Deploy) -> "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 *    - ประเภท: "เว็บแอป" (Web app)
 *    - ผู้มีสิทธิ์เข้าถึง: "ทุกคน" (Anyone)
 * 7. คัดลอก Web App URL ที่ได้ มาวางในหน้าต่างตั้งค่าของระบบ
 * ==============================================================================
 */

// รหัสความปลอดภัยสำหรับตรวจสอบสิทธิ์การเรียก API (API Secret Token)
const API_SECRET_TOKEN = 'SILA_SECRET_2571_2575';

// ชื่อแท็บชีตต่างๆ ในระบบ
const SHEET_NAMES = {
  PROJECTS: 'Projects',
  PLAN_APPROVALS: 'PlanApprovals',
  BUDGET_APPROVALS: 'BudgetApprovals',
  PROJECT_TRACKINGS: 'ProjectTrackings',
  USERS: 'Users',
  OPTIONS: 'Options',
  AUDIT_LOGS: 'AuditLogs'
};

/**
 * ตรวจสอบ Token ความปลอดภัย
 */
function validateToken(token) {
  if (!API_SECRET_TOKEN || API_SECRET_TOKEN === '') return true;
  return token === API_SECRET_TOKEN;
}

/**
 * บันทึก Audit Log ลงชีต AuditLogs
 */
function logAudit(action, details, user) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.AUDIT_LOGS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAMES.AUDIT_LOGS);
      const headers = ['Timestamp', 'Action', 'User', 'Details'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeaderRow(sheet, headers.length, '#4c1d95');
    }
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([timestamp, action, user || 'System', JSON.stringify(details || {})]);
  } catch (e) {
    console.error('Audit log failed', e);
  }
}

/**
 * 1. สร้างเมนูคำสั่งพิเศษบน Google Sheets เมื่อเปิดไฟล์
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏛️ ระบบแผนพัฒนาเทศบาลเมืองศิลา')
    .addItem('⚙️ ติดตั้งโครงสร้างชีตทั้งหมด (Initial Setup)', 'initialSetup')
    .addSeparator()
    .addItem('📥 นำเข้าชุดข้อมูลตั้งต้น (Seed Data)', 'seedInitialData')
    .addItem('🔄 ล้างข้อมูลทดสอบทั้งหมด (Reset)', 'resetAllSheets')
    .addToUi();
}

/**
 * 2. ติดตั้งแท็บและโครงสร้างตารางฐานข้อมูลอัตโนมัติ (Headers & Formatting)
 */
function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. ชีต Projects
  let pSheet = ss.getSheetByName(SHEET_NAMES.PROJECTS);
  if (!pSheet) pSheet = ss.insertSheet(SHEET_NAMES.PROJECTS);
  pSheet.clear();
  const projectHeaders = [
    'ID', 'ปี พ.ศ.', 'ประเด็นการพัฒนา', 'แผนงาน', 'ชื่อโครงการ', 'วัตถุประสงค์',
    'เป้าหมาย (ผลผลิต)', 'งบประมาณ 2571', 'งบประมาณ 2572', 'งบประมาณ 2573',
    'งบประมาณ 2574', 'งบประมาณ 2575', 'ผลที่คาดว่าจะได้รับ', 'หน่วยงานรับผิดชอบหลัก',
    'ประเภทรายการ', 'สถานะดำเนินงาน', 'เหตุผลและความจำเป็น', 'ความก้าวหน้า (ร้อยละ)',
    'ผลการเบิกจ่าย (บาท)', 'วันที่บันทึก', 'วันที่แก้ไขล่าสุด'
  ];
  pSheet.getRange(1, 1, 1, projectHeaders.length).setValues([projectHeaders]);
  formatHeaderRow(pSheet, projectHeaders.length, '#4c1d95'); // Royal Purple
  pSheet.setFrozenRows(1);
  
  // 2. ชีต PlanApprovals
  let aSheet = ss.getSheetByName(SHEET_NAMES.PLAN_APPROVALS);
  if (!aSheet) aSheet = ss.insertSheet(SHEET_NAMES.PLAN_APPROVALS);
  aSheet.clear();
  const approvalHeaders = [
    'ID', 'ประเภท', 'ครั้งที่', 'ปี พ.ศ.', 'วันที่อนุมัติประกาศใช้', 'เลขที่ประกาศ',
    'ผู้อนุมัติ', 'ผู้ลงนาม', 'ProjectIDs', 'จำนวนโครงการ', 'งบประมาณรวม', 'บันทึกเพิ่มเติม', 'วันที่บันทึก'
  ];
  aSheet.getRange(1, 1, 1, approvalHeaders.length).setValues([approvalHeaders]);
  formatHeaderRow(aSheet, approvalHeaders.length, '#3b0764'); // Dark Royal
  aSheet.setFrozenRows(1);

  // 3. ชีต BudgetApprovals
  let bSheet = ss.getSheetByName(SHEET_NAMES.BUDGET_APPROVALS);
  if (!bSheet) bSheet = ss.insertSheet(SHEET_NAMES.BUDGET_APPROVALS);
  bSheet.clear();
  const budgetHeaders = [
    'ID', 'ปีงบประมาณ', 'แหล่งที่มาของงบประมาณ', 'วันที่อนุมัติงบประมาณ', 'จำนวนงบประมาณที่อนุมัติ (บาท)',
    'งบประมาณตามแผน', 'ProjectIDs', 'จำนวนโครงการ', 'มติ/หน่วยงานผู้อนุมัติ', 'บันทึกเพิ่มเติม', 'วันที่บันทึก'
  ];
  bSheet.getRange(1, 1, 1, budgetHeaders.length).setValues([budgetHeaders]);
  formatHeaderRow(bSheet, budgetHeaders.length, '#b45309'); // Amber/Gold
  bSheet.setFrozenRows(1);

  // 4. ชีต ProjectTrackings
  let tSheet = ss.getSheetByName(SHEET_NAMES.PROJECT_TRACKINGS);
  if (!tSheet) tSheet = ss.insertSheet(SHEET_NAMES.PROJECT_TRACKINGS);
  tSheet.clear();
  const trackHeaders = [
    'ID', 'projectID', 'ปีงบ', 'ชื่อโครงการ', 'สถานะโครงการ', 'ความคืบหน้า (%)',
    'งบประมาณที่ได้รับจัดสรร', 'ผลการเบิกจ่าย', 'ผู้รับผิดชอบ', 'หมายเหตุ/ปัญหาที่พบ', 'วันที่บันทึกล่าสุด'
  ];
  tSheet.getRange(1, 1, 1, trackHeaders.length).setValues([trackHeaders]);
  formatHeaderRow(tSheet, trackHeaders.length, '#047857');
  tSheet.setFrozenRows(1);

  // 5. ชีต Users
  let uSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!uSheet) uSheet = ss.insertSheet(SHEET_NAMES.USERS);
  uSheet.clear();
  const userHeaders = [
    'ID', 'ชื่อ-สกุล', 'ตำแหน่ง', 'หน่วยงาน/กอง', 'อีเมล', 'เบอร์โทรศัพท์', 'สิทธิ์การใช้งาน', 'สถานะ', 'วันที่บันทึก'
  ];
  uSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
  formatHeaderRow(uSheet, userHeaders.length, '#5b21b6');
  uSheet.setFrozenRows(1);

  SpreadsheetApp.getActiveSpreadsheet().toast('✅ ติดตั้งโครงสร้างชีตฐานข้อมูลเทศบาลเมืองศิลาเรียบร้อยแล้ว', 'สำเร็จ', 5);
}

function formatHeaderRow(sheet, colCount, hexColor) {
  const header = sheet.getRange(1, 1, 1, colCount);
  header.setBackground(hexColor)
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setFontFamily('Sarabun')
        .setFontSize(10)
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 32);
}

/**
 * 3. WEB APP API ROUTER (doGet)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'healthCheck';
    const token = (e && e.parameter && e.parameter.token) || '';

    if (action === 'healthCheck') {
      return jsonResponse({
        status: 'ok',
        success: true,
        message: 'เชื่อมต่อกับ Google Apps Script และ Google Sheets สำเร็จ',
        tokenValid: validateToken(token),
        timestamp: new Date().toISOString()
      });
    }

    if (!validateToken(token)) {
      return jsonResponse({ status: 'error', success: false, message: 'Authentication failed: Invalid Secret Token' });
    }

    let result = {};
    switch (action) {
      case 'getAllData':
        result = {
          status: 'ok',
          success: true,
          data: {
            projects: getTableData(SHEET_NAMES.PROJECTS),
            approvals: getTableData(SHEET_NAMES.PLAN_APPROVALS),
            budgetApprovals: getTableData(SHEET_NAMES.BUDGET_APPROVALS),
            projectTrackings: getTableData(SHEET_NAMES.PROJECT_TRACKINGS),
            users: getTableData(SHEET_NAMES.USERS)
          }
        };
        break;

      default:
        result = { status: 'error', message: 'Invalid action: ' + action };
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * 4. WEB APP API ROUTER (doPost)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const token = postData.token;

    if (!validateToken(token)) {
      return jsonResponse({ status: 'error', message: 'Authentication failed: Invalid Secret Token' });
    }

    let result = {};
    if (action === 'syncAllData') {
      result = syncAllDataToSheets(postData.data);
      logAudit('SYNC_ALL_DATA', { projectCount: (postData.data.projects || []).length });
    } else {
      result = { status: 'error', message: 'Unknown post action: ' + action };
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getTableData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return rows.map((row) => {
    const obj = {};
    headers.forEach((h, idx) => {
      if (h) {
        let val = row[idx];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, 'Asia/Bangkok', 'yyyy-MM-dd');
        }
        obj[h] = val;
      }
    });
    return obj;
  });
}

function syncAllDataToSheets(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (payload.projects && payload.projects.length > 0) {
    let pSheet = ss.getSheetByName(SHEET_NAMES.PROJECTS);
    if (pSheet && pSheet.getLastColumn() > 0) {
      const headers = pSheet.getRange(1, 1, 1, pSheet.getLastColumn()).getValues()[0];
      const rows = payload.projects.map((p) => headers.map((h) => p[h] !== undefined ? p[h] : ''));
      if (pSheet.getLastRow() > 1) {
        pSheet.getRange(2, 1, pSheet.getLastRow() - 1, pSheet.getLastColumn()).clearContent();
      }
      pSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }
  return { status: 'ok', success: true, message: 'Updated sheets successfully' };
}
`;

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  onRefreshAll,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'code' | 'docs'>('sync');
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<GasConfig>(ApiSyncService.getConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(ApiSyncService.getConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveConfig = () => {
    ApiSyncService.saveConfig(config);
    if (onShowToast) onShowToast('บันทึกการตั้งค่าแล้ว', 'บันทึก URL และ Secret Token เรียบร้อย');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await ApiSyncService.testConnection(config.webAppUrl, config.apiSecretToken);
      setTestResult(res);
      setConfig(ApiSyncService.getConfig());
      if (onShowToast) {
        onShowToast(
          res.success ? 'เชื่อมต่อสำเร็จ' : 'เชื่อมต่อล้มเหลว',
          res.message,
          res.success ? 'success' : 'error'
        );
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handlePullFromSheets = async () => {
    setIsSyncing(true);
    try {
      const res = await ApiSyncService.pullFromSheets();
      if (res.success) {
        if (onRefreshAll) onRefreshAll();
        if (onShowToast) onShowToast('ซิงค์ข้อมูลสำเร็จ', res.message);
      } else {
        if (onShowToast) onShowToast('เกิดข้อผิดพลาด', res.message, 'error');
      }
      setConfig(ApiSyncService.getConfig());
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheets = async () => {
    setIsSyncing(true);
    try {
      const res = await ApiSyncService.pushAllToSheets();
      if (res.success) {
        if (onShowToast) onShowToast('อัปโหลดข้อมูลสำเร็จ', res.message);
      } else {
        if (onShowToast) onShowToast('เกิดข้อผิดพลาด', res.message, 'error');
      }
      setConfig(ApiSyncService.getConfig());
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-3 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-emerald-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006754] text-white flex items-center justify-center shadow-md">
              <Code className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                เชื่อมต่อ Google Sheets & Google Apps Script (GAS)
              </h3>
              <p className="text-[10px] text-[#006754] font-semibold">
                ระบบจัดการฐานข้อมูลออนไลน์เทศบาลเมืองศิลา 2-Way Sync
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'sync' ? 'bg-[#006754] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-200" />
            <span>ตั้งค่าการเชื่อมต่อ & ซิงค์ข้อมูล (Live Sync)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'code' ? 'bg-[#006754] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>โค้ด Code.gs (Apps Script)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'docs' ? 'bg-[#006754] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ขั้นตอนการติดตั้ง</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
          {/* TAB 1: LIVE SYNC & CONFIG */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-emerald-300/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#006754] text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#006754]" />
                    <span>กำหนดค่าเชื่อมต่อ Google Apps Script Web App</span>
                  </div>
                  {config.status === 'connected' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      เชื่อมต่อแล้ว
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Google Apps Script Web App URL
                    </label>
                    <input
                      type="url"
                      value={config.webAppUrl}
                      onChange={(e) => setConfig({ ...config, webAppUrl: e.target.value })}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#006754] focus:border-[#006754] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      API Secret Token (รหัสผ่านความปลอดภัย)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={config.apiSecretToken}
                        onChange={(e) => setConfig({ ...config, apiSecretToken: e.target.value })}
                        placeholder="SILA_SECRET_2571_2575"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#006754] focus:border-[#006754] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveConfig}
                        className="px-3 py-2 rounded-lg bg-[#006754] hover:bg-[#005243] text-white font-bold text-xs shrink-0 cursor-pointer transition shadow-xs"
                      >
                        บันทึกการตั้งค่า
                      </button>
                    </div>
                  </div>
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isTesting || !config.webAppUrl}
                    onClick={handleTestConnection}
                    className="px-3 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-200" />
                    <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSyncing || !config.webAppUrl}
                    onClick={handlePullFromSheets}
                    className="px-3 py-2 rounded-lg bg-[#006754] hover:bg-[#005243] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-200 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>ดึงข้อมูลล่าสุดจาก Google Sheets</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSyncing || !config.webAppUrl}
                    onClick={handlePushToSheets}
                    className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>อัปโหลดข้อมูลระบบขึ้น Google Sheets</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CODE */}
          {activeTab === 'code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">ซอร์สโค้ดไฟล์ Code.gs</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#006754] hover:bg-[#005243] text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'คัดลอกสำเร็จแล้ว' : 'คัดลอกโค้ดทั้งหมด'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-950 text-emerald-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-96 custom-scrollbar border border-emerald-900/40 leading-relaxed">
                <code>{APPS_SCRIPT_CODE}</code>
              </pre>
            </div>
          )}

          {/* TAB 3: DOCS */}
          {activeTab === 'docs' && (
            <div className="space-y-3 text-slate-700 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">ขั้นตอนการติดตั้ง Google Apps Script บน Google Sheets:</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>เปิดสเปรดชีต Google Sheets ที่ต้องการใช้งาน</li>
                  <li>คลิกเมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong></li>
                  <li>ลบโค้ดเดิมทั้งหมดในไฟล์ <code>Code.gs</code> แล้ววางโค้ดจากแท็บ "โค้ด Code.gs"</li>
                  <li>คลิกปุ่มบันทึก (รูปแผ่นดิสก์ หรือกด Ctrl + S)</li>
                  <li>เลือกฟังก์ชัน <code>initialSetup</code> จากเมนูดรอปดาวน์ด้านบน แล้วกด <strong>เรียกใช้ (Run)</strong> เพื่อสร้างแท็บตารางทั้งหมด</li>
                  <li>คลิกปุ่ม <strong>ทำให้ใช้งานได้ (Deploy)</strong> มุมขวาบน &gt; <strong>การทำให้ใช้งานได้รายการใหม่ (New deployment)</strong></li>
                  <li>เลือกประเภทเป็น <strong>เว็บแอป (Web app)</strong></li>
                  <li>กำหนด <strong>ผู้มีสิทธิ์เข้าถึง (Who has access)</strong> เป็น <strong>ทุกคน (Anyone)</strong></li>
                  <li>กด "ทำให้ใช้งานได้" และคัดลอก URL เว็บแอปมาวางในแท็บ "ตั้งค่าการเชื่อมต่อ"</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end mt-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
