import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Search, Plus, Trash2, Camera, Power, X, Save, RotateCcw, Printer, Settings, QrCode, Zap } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// ==========================================
// Types & Interfaces
// ==========================================

interface ProcessItem {
  prcCd: string;
  prcName: string;
  prcKind: string;
  prcOdChk: string;
  areaId: string;
}

interface WorkResult {
  prcOdCd: string;
  areaId: string;
  prcCd: string;
  prcName: string;
  prcDt: string;
  prcOdUserCd: string;
  mainEmpId: string;
  mainEmpName: string;
  prcActDt: string;
  isEnd: string;
  inSt: number;
  lotNo: string;
  endEtc: string | null;
}

interface WorkResultDetail {
  seqNo: number;
  itemCd: string;
  itemName: string;
  std: string | null;
  prcRealQty: number;
  badQty: number;
  prcCd: string;
  dayNight: string;
  inOutTag: string;
  bigo: string | null;
}

interface ApiItem {
  itemCd: string;
  itemName: string;
  std: string | null;
  unitCd: string | null;
}

interface ApiEmployee {
  empId: string;
  empName: string;
  deptName: string | null;
}

// ==========================================
// Initial Data & Config
// ==========================================

const initialFormData: Partial<WorkResult> = {
  prcOdCd: '', prcCd: '', prcName: '', prcDt: '',
  prcOdUserCd: '', mainEmpId: '', mainEmpName: '',
  prcActDt: new Date().toISOString().split('T')[0],
  isEnd: '2', inSt: 0, lotNo: '', endEtc: '',
};

const emptyDetailForm: Partial<WorkResultDetail> = {
  seqNo: 0, itemCd: '', itemName: '', std: '', prcRealQty: 0,
  badQty: 0, prcCd: '', dayNight: 'D', inOutTag: '1', bigo: '',
};

const mockProcessList: ProcessItem[] = [
  { prcCd: '90', prcName: '조립(포장, 방청, 도장)', prcKind: '3', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '12', prcName: '단조[12]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '14', prcName: 'Q/T 열처리[14]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '16', prcName: 'LINK 고주파[16]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '17', prcName: 'BUSHING 내경고...', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '18', prcName: 'SPRAY Q/T 열...', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '19', prcName: 'BUSHING 측면 고...', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '20', prcName: 'THROUGH HAR...', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '21', prcName: 'BUSHING 외경고...', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '22', prcName: '침탄 열처리[22]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '23', prcName: 'PIN 외경고주파[23]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '24', prcName: 'LINK 양면삭[24]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '25', prcName: 'LINK 보링[25]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '26', prcName: 'LINK 유도릴[26]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '27', prcName: 'LINK 좌석[27]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '28', prcName: 'M/LINK KEY 홈파...', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '29', prcName: 'BACK 보링[29]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '30', prcName: 'M/LINK 드릴[30]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '31', prcName: 'M/LINK 탭[31]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '32', prcName: 'M/LINK 와이어 절...', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '33', prcName: 'M/LINK PIN END...', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '34', prcName: 'M/LINK BUSH EN...', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: '38', prcName: '건드릴[38]', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
];

// ==========================================
// MES Search Modal (Purple Theme)
// ==========================================

function MesSearchModal<T extends Record<string, any>>({ 
  isOpen, 
  onClose, 
  title, 
  data, 
  onSelect,
  columns,
  isLoading,
  onSearch,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  data: T[]; 
  onSelect: (item: T) => void;
  columns: { key: string; label: string; width?: string }[];
  isLoading?: boolean;
  onSearch?: (query: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  
  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val ?? '').toLowerCase().includes(search.toLowerCase())
    )
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIdx(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(prev => prev === null ? 0 : Math.min(prev + 1, filteredData.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(prev => prev === null ? 0 : Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && selectedIdx !== null && filteredData[selectedIdx]) {
        e.preventDefault();
        onSelect(filteredData[selectedIdx]);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIdx, filteredData, onSelect, onClose]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSelectedIdx(null);
    onSearch?.(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[720px] p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        {/* Purple Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Settings className="w-4 h-4 opacity-80" />
            <span className="font-bold text-sm">{title}</span>
          </div>
          <DialogClose className="text-white/70 hover:text-white transition-colors rounded-sm hover:bg-white/10 p-1">
            <X className="w-4 h-4" />
          </DialogClose>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b bg-white flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="품목코드 또는 품목명 검색..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9 text-sm"
              autoFocus
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9 px-3 shadow-sm">
            <Camera className="w-4 h-4" /> MES
          </Button>
        </div>

        {/* Column Headers */}
        <div className="bg-slate-50 border-b">
          <div className="px-4 py-1.5 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              총 <span className="text-purple-700 font-bold">{filteredData.length}</span>건
            </span>
            {isLoading && <span className="text-xs text-blue-500 animate-pulse">조회 중...</span>}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-t">
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-2 text-left text-xs font-bold text-slate-600 bg-slate-100/80" style={col.width ? { width: col.width } : undefined}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Table Body */}
        <div className="max-h-[380px] overflow-y-auto bg-white">
          <table className="w-full">
            <tbody>
              {filteredData.map((item, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    "border-b cursor-pointer transition-colors",
                    selectedIdx === idx
                      ? "bg-purple-100 text-purple-900"
                      : "hover:bg-purple-50/60"
                  )}
                  onClick={() => { onSelect(item); onClose(); }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-2.5 text-xs" style={col.width ? { width: col.width } : undefined}>
                      {item[col.key] != null ? String(item[col.key]) : <span className="text-slate-300">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-slate-400 text-sm">
                    {isLoading ? '데이터를 불러오는 중...' : '데이터가 없습니다'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t flex gap-6 text-[11px] text-slate-400">
          <span>↑↓ 이동</span>
          <span>Enter 선택</span>
          <span>ESC 닫기</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Main Page Component
// ==========================================

export default function WorkResultPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<Partial<WorkResult>>(initialFormData);
  const [details, setDetails] = useState<WorkResultDetail[]>([]);
  const [selectedPrcOdCd, setSelectedPrcOdCd] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selectedDetailIndex, setSelectedDetailIndex] = useState<number | null>(null);
  const [selectedProcessIdx, setSelectedProcessIdx] = useState<number | null>(null);
  
  // Modal State
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalTarget, setItemModalTarget] = useState<{ type: 'detail'; seqNo: number }>({ type: 'detail', seqNo: 0 });
  
  // Barcode Scanner State
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [barcodeAutoMode, setBarcodeAutoMode] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  
  const mesVideoRef = useRef<HTMLVideoElement>(null);
  const mesCodeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // ==========================================
  // API Queries
  // ==========================================

  const { data: apiItems = [], isLoading: itemsLoading } = useQuery<ApiItem[]>({
    queryKey: ["/api/items"],
    queryFn: async () => {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
  });

  const { data: apiEmployees = [], isLoading: empsLoading } = useQuery<ApiEmployee[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
  });

  // ==========================================
  // Handlers
  // ==========================================

  const handleNew = () => {
    const currentPrcCd = formData.prcCd;
    const currentPrcName = formData.prcName;
    
    setFormData({
      ...initialFormData,
      prcOdCd: `WO-${Date.now()}`,
      prcOdUserCd: `WO-${Date.now()}`,
      prcCd: currentPrcCd || '',
      prcName: currentPrcName || '',
      prcActDt: new Date().toISOString().split('T')[0],
    });
    setDetails([]);
    setIsNew(true);
    setSelectedPrcOdCd(null);
    setScanCount(0);
    setLastScanResult(null);
    toast({ title: "신규 작성", description: "새로운 작업실적을 입력합니다." });
  };

  const handleSave = async () => {
    if (!formData.prcCd) {
      toast({ variant: "destructive", title: "오류", description: "공정을 먼저 선택해주세요." });
      return;
    }
    if (details.length === 0) {
      toast({ variant: "destructive", title: "오류", description: "상세내역을 입력해주세요." });
      return;
    }
    try {
      const res = await fetch("/api/work-performances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderNo: formData.prcOdCd || `WO-${Date.now()}`,
          itemCd: details[0]?.itemCd || null,
          empId: formData.mainEmpId || null,
          planQty: details.reduce((sum, d) => sum + (d.prcRealQty || 0), 0),
          prodQty: details.reduce((sum, d) => sum + (d.prcRealQty || 0), 0),
          badQty: details.reduce((sum, d) => sum + (d.badQty || 0), 0),
          status: "RUNNING",
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast({ title: "저장 완료", description: "작업실적이 저장되었습니다." });
      setIsNew(false);
      queryClient.invalidateQueries({ queryKey: ["/api/vision/stats"] });
    } catch {
      toast({ variant: "destructive", title: "저장 실패", description: "서버 오류가 발생했습니다." });
    }
  };

  const handleSelectProcess = (idx: number) => {
    setSelectedProcessIdx(idx);
    const proc = mockProcessList[idx];
    setFormData(prev => ({
      ...prev,
      prcCd: proc.prcCd,
      prcName: proc.prcName,
    }));
  };

  const addDetailRow = () => {
    if (!formData.prcCd) {
      toast({ variant: "destructive", title: "오류", description: "공정을 먼저 선택해주세요." });
      return;
    }
    const newSeqNo = details.length > 0 ? Math.max(...details.map(d => d.seqNo)) + 1 : 1;
    setDetails(prev => [...prev, {
      ...emptyDetailForm,
      seqNo: newSeqNo,
      prcCd: formData.prcCd || '',
    } as WorkResultDetail]);
  };

  const removeDetailRow = (seqNo: number) => {
    setDetails(prev => prev.filter(d => d.seqNo !== seqNo));
    setSelectedDetailIndex(null);
  };

  const handleDetailChange = (seqNo: number, field: keyof WorkResultDetail, value: any) => {
    setDetails(prev => prev.map(d =>
      d.seqNo === seqNo ? { ...d, [field]: value } : d
    ));
  };

  const handleItemSelect = (item: ApiItem) => {
    setDetails(prev => prev.map(d =>
      d.seqNo === itemModalTarget.seqNo
        ? { ...d, itemCd: item.itemCd, itemName: item.itemName, std: item.std }
        : d
    ));
  };

  const handleEmpSelect = (emp: ApiEmployee) => {
    setFormData(prev => ({
      ...prev,
      mainEmpId: emp.empId,
      mainEmpName: emp.empName,
    }));
  };

  // ==========================================
  // Barcode/QR Auto Work Order Input
  // ==========================================

  const addItemToDetails = useCallback((item: { itemCd: string; itemName: string; std: string | null }, qty?: number) => {
    setDetails(prev => {
      const emptyIdx = prev.findIndex(d => !d.itemCd);
      if (emptyIdx >= 0) {
        return prev.map((d, idx) =>
          idx === emptyIdx
            ? { ...d, itemCd: item.itemCd, itemName: item.itemName, std: item.std, prcRealQty: qty || d.prcRealQty }
            : d
        );
      }
      const newSeqNo = prev.length > 0 ? Math.max(...prev.map(d => d.seqNo)) + 1 : 1;
      return [...prev, {
        ...emptyDetailForm,
        seqNo: newSeqNo,
        itemCd: item.itemCd,
        itemName: item.itemName,
        std: item.std,
        prcRealQty: qty || 0,
        prcCd: formData.prcCd || '',
      } as WorkResultDetail];
    });
    setScanCount(prev => prev + 1);
  }, [formData.prcCd]);

  const handleBarcodeScan = useCallback(async (code: string) => {
    if (!code) return;
    setLastScanResult(code);

    try {
      // Try parsing as JSON (QR code with structured data)
      const parsed = JSON.parse(code);

      if (parsed.workOrderNo) {
        // Work order QR → auto-fill master form
        setFormData(prev => ({
          ...prev,
          prcOdCd: parsed.workOrderNo,
          prcOdUserCd: parsed.workOrderNo,
          mainEmpId: parsed.empId || prev.mainEmpId,
          mainEmpName: parsed.empName || prev.mainEmpName,
          lotNo: parsed.lotNo || prev.lotNo,
        }));

        if (parsed.itemCd) {
          const res = await fetch(`/api/items/${encodeURIComponent(parsed.itemCd)}`);
          if (res.ok) {
            const item = await res.json();
            addItemToDetails(item, parsed.qty);
          }
        }
        toast({ title: "작업지시 QR 스캔 완료", description: `작업번호: ${parsed.workOrderNo}` });
        return;
      }

      if (parsed.itemCd) {
        // Item QR with optional quantity
        const res = await fetch(`/api/items/${encodeURIComponent(parsed.itemCd)}`);
        if (res.ok) {
          const item = await res.json();
          addItemToDetails(item, parsed.qty);
          toast({ title: "품목 QR 스캔 완료", description: `${item.itemName} (${item.itemCd})` });
        }
        return;
      }
    } catch {
      // Not JSON → treat as plain barcode (item code)
    }

    try {
      const res = await fetch(`/api/items/${encodeURIComponent(code)}`);
      if (res.ok) {
        const item = await res.json();
        addItemToDetails(item);
        toast({ title: "바코드 스캔 완료", description: `${item.itemName} (${item.itemCd})` });
      } else {
        addItemToDetails({ itemCd: code, itemName: '미등록 품목', std: null });
        toast({ variant: "destructive", title: "미등록 바코드", description: `${code} - 품목 마스터에 등록되지 않은 코드입니다.` });
      }
    } catch {
      toast({ variant: "destructive", title: "스캔 오류", description: "서버 연결에 실패했습니다." });
    }

    if (!barcodeAutoMode) {
      setBarcodeScannerOpen(false);
    }
  }, [formData.prcCd, barcodeAutoMode, toast, addItemToDetails]);

  // Barcode Scanner Effect
  useEffect(() => {
    if (!barcodeScannerOpen) {
      if (mesCodeReaderRef.current) {
        mesCodeReaderRef.current.reset();
        mesCodeReaderRef.current = null;
      }
      return;
    }

    const codeReader = new BrowserMultiFormatReader();
    mesCodeReaderRef.current = codeReader;
    let lastScannedCode = '';
    let lastScannedTime = 0;

    if (mesVideoRef.current) {
      codeReader.decodeFromVideoDevice(null, mesVideoRef.current, (result) => {
        if (result) {
          const code = result.getText();
          const now = Date.now();
          // Debounce: ignore same code within 2 seconds
          if (code === lastScannedCode && now - lastScannedTime < 2000) return;
          lastScannedCode = code;
          lastScannedTime = now;
          handleBarcodeScan(code);
        }
      }).catch(err => console.error("Scanner error:", err));
    }

    return () => { codeReader.reset(); };
  }, [barcodeScannerOpen, handleBarcodeScan]);

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="min-h-screen flex flex-col p-2 bg-slate-50 text-sm">
      {/* Search Modals */}
      <MesSearchModal<ApiItem>
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title="품목 조회"
        data={apiItems}
        isLoading={itemsLoading}
        onSelect={handleItemSelect}
        columns={[
          { key: 'itemCd', label: '품목코드', width: '30%' },
          { key: 'itemName', label: '품목명', width: '40%' },
          { key: 'std', label: '규격', width: '20%' },
          { key: 'unitCd', label: '단위', width: '10%' },
        ]}
      />

      <MesSearchModal<ApiEmployee>
        isOpen={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        title="사원 조회"
        data={apiEmployees}
        isLoading={empsLoading}
        onSelect={handleEmpSelect}
        columns={[
          { key: 'empId', label: '사원번호', width: '30%' },
          { key: 'empName', label: '성명', width: '35%' },
          { key: 'deptName', label: '부서', width: '35%' },
        ]}
      />

      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded border mb-2 shadow-sm">
        <Button size="sm" variant="outline" className="h-8 border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => {}}>
          <Search className="w-3 h-3 mr-1" /> 조회 <span className="text-[10px] ml-1 text-slate-400">(Ctrl+F)</span>
        </Button>
        <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={handleNew}>
          <Plus className="w-3 h-3 mr-1" /> 신규 <span className="text-[10px] ml-1 opacity-70">(Ctrl+A)</span>
        </Button>
        <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={handleSave}>
          <Save className="w-3 h-3 mr-1" /> 저장 <span className="text-[10px] ml-1 opacity-70">(Ctrl+S)</span>
        </Button>
        <Button size="sm" variant="destructive" className="h-8">
          <Trash2 className="w-3 h-3 mr-1" /> 삭제 <span className="text-[10px] ml-1 opacity-70">(Ctrl+D)</span>
        </Button>
        <Button size="sm" variant="outline" className="h-8 border-orange-300 text-orange-700 hover:bg-orange-50">
          <Printer className="w-3 h-3 mr-1" /> 인쇄 <span className="text-[10px] ml-1 text-slate-400">(Ctrl+P)</span>
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">작업실적등록</span>
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-36 h-8 text-xs"
          />
          <Button size="sm" variant="outline" className="h-8" onClick={() => {}}>
            <Search className="w-3 h-3 mr-1" /> 조회
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-2 flex-1">
        
        {/* Left Side: Process List */}
        <div className="w-full lg:w-[220px] flex flex-col gap-2">
          <Card className="flex-1">
            <CardHeader className="p-2 bg-slate-700 text-white rounded-t-lg">
              <CardTitle className="text-xs font-semibold">작업공정</CardTitle>
            </CardHeader>
            <div className="overflow-auto max-h-[calc(100vh-200px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-8 text-center p-1 text-[10px]">No</TableHead>
                    <TableHead className="p-1 text-[10px]">종류</TableHead>
                    <TableHead className="p-1 text-[10px]">공정명</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProcessList.map((proc, idx) => (
                    <TableRow
                      key={proc.prcCd}
                      className={cn(
                        "cursor-pointer text-[11px]",
                        selectedProcessIdx === idx
                          ? "bg-purple-100 text-purple-900 font-bold"
                          : "hover:bg-slate-50"
                      )}
                      onClick={() => handleSelectProcess(idx)}
                    >
                      <TableCell className="text-center p-1">{idx + 1}</TableCell>
                      <TableCell className="p-1">
                        <span className={cn(
                          "text-[10px] px-1 rounded",
                          proc.prcKind === '3' ? 'text-blue-700 bg-blue-50' : 'text-green-700 bg-green-50'
                        )}>
                          {proc.prcKind === '3' ? '완제품공정' : '중간공정'}
                        </span>
                      </TableCell>
                      <TableCell className="p-1 truncate max-w-[120px]">{proc.prcName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Right Side: Master & Detail */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Master Info Form */}
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-bold">공정</Label>
                  <div className="flex gap-1">
                    <Input className="w-16 h-7 text-xs bg-slate-100" value={formData.prcCd || ''} readOnly />
                    <Input className="flex-1 h-7 text-xs bg-slate-100" value={formData.prcName || ''} readOnly />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">실적번호</Label>
                  <Input className="h-7 text-xs bg-slate-50" value={formData.prcOdCd || ''} readOnly />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-red-500 font-bold">작업일자</Label>
                  <Input type="date" className="h-7 text-xs"
                    value={formData.prcActDt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, prcActDt: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">지시자</Label>
                  <div className="flex gap-1">
                    <Input className="flex-1 h-7 text-xs" value={formData.mainEmpId || ''} placeholder="사번" readOnly />
                    <Input className="flex-1 h-7 text-xs bg-slate-50" value={formData.mainEmpName || ''} placeholder="이름" readOnly />
                    <Button variant="outline" className="h-7 w-7 p-0" onClick={() => setEmpModalOpen(true)}>
                      <Search className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">작업자1</Label>
                  <div className="flex gap-1">
                    <Input className="flex-1 h-7 text-xs" placeholder="사번" />
                    <Button variant="outline" className="h-7 w-7 p-0"><Search className="w-3 h-3" /></Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">투입공수</Label>
                  <Input type="number" className="h-7 text-xs" defaultValue={0} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">작업호기</Label>
                  <Input className="h-7 text-xs" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">원자재LOT</Label>
                  <div className="flex gap-1 items-center">
                    <Input className="flex-1 h-7 text-xs" value={formData.lotNo || ''} onChange={(e) => setFormData(prev => ({ ...prev, lotNo: e.target.value }))} />
                    <span className="text-xs text-slate-500">마감</span>
                    <span className="font-bold text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">N</span>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs">특이사항</Label>
                <Input className="h-7 text-xs mt-1" value={formData.endEtc || ''} onChange={(e) => setFormData(prev => ({ ...prev, endEtc: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          {/* Detail Grid */}
          <Card className="flex-1 flex flex-col min-h-[320px]">
            <CardHeader className="p-2 bg-slate-100 border-b flex flex-row justify-between items-center">
              <CardTitle className="text-xs font-semibold">상세내역</CardTitle>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className={cn("h-7 text-xs gap-1", barcodeScannerOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700")}
                  onClick={() => setBarcodeScannerOpen(!barcodeScannerOpen)}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {barcodeScannerOpen ? '스캔 중지' : '바코드 스캔'}
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addDetailRow}>
                  <Plus className="w-3 h-3 mr-1" /> 추가
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs"
                  onClick={() => selectedDetailIndex !== null && removeDetailRow(details[selectedDetailIndex].seqNo)}
                  disabled={selectedDetailIndex === null}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> 삭제
                </Button>
              </div>
            </CardHeader>

            {/* Barcode Scanner Panel */}
            {barcodeScannerOpen && (
              <div className="border-b bg-slate-900 p-3">
                <div className="flex gap-3 items-start">
                  <div className="relative w-48 h-36 rounded-lg overflow-hidden bg-black border border-slate-700 flex-shrink-0">
                    <video ref={mesVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    <div className="absolute inset-0 border-2 border-green-400/30 rounded-lg pointer-events-none" />
                    <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-red-500/60 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-400 text-xs font-bold">스캐너 활성화됨</span>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => setBarcodeAutoMode(!barcodeAutoMode)}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                            barcodeAutoMode
                              ? "bg-green-500/20 border-green-500/50 text-green-400"
                              : "bg-slate-700 border-slate-600 text-slate-400"
                          )}
                        >
                          <Zap className="w-3 h-3 inline mr-1" />
                          연속 스캔 {barcodeAutoMode ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mb-2 space-y-1">
                      <p>바코드 또는 QR코드를 카메라에 비춰주세요.</p>
                      <p className="text-slate-500">지원 형식: 바코드(품목코드), QR(작업지시 JSON)</p>
                    </div>
                    {lastScanResult && (
                      <div className="bg-slate-800 rounded p-2 text-xs">
                        <span className="text-slate-500">마지막 스캔:</span>{' '}
                        <span className="text-green-400 font-mono">{lastScanResult}</span>
                      </div>
                    )}
                    <div className="mt-2 flex gap-3 text-xs text-slate-500">
                      <span>스캔 횟수: <span className="text-white font-bold">{scanCount}</span></span>
                      <span>등록 건수: <span className="text-white font-bold">{details.filter(d => d.itemCd).length}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Table */}
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-8 text-center p-1">No</TableHead>
                    <TableHead className="p-1 min-w-[130px]">품목코드</TableHead>
                    <TableHead className="p-1 min-w-[160px]">품명</TableHead>
                    <TableHead className="p-1 min-w-[80px]">규격</TableHead>
                    <TableHead className="p-1 w-16 text-center">실적환산</TableHead>
                    <TableHead className="p-1 w-24">설비</TableHead>
                    <TableHead className="p-1 w-20">작업자</TableHead>
                    <TableHead className="p-1 w-12 text-center">주/야</TableHead>
                    <TableHead className="p-1 w-20 text-right">시간톤단가</TableHead>
                    <TableHead className="p-1 w-20 text-right">총톤가</TableHead>
                    <TableHead className="p-1 w-14 text-center">사내/외</TableHead>
                    <TableHead className="p-1 w-16 text-right">불량</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center h-32 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <QrCode className="w-8 h-8 opacity-30" />
                          <p>바코드를 스캔하거나 추가 버튼을 눌러 품목을 등록하세요</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    details.map((d, idx) => (
                      <TableRow
                        key={d.seqNo}
                        className={cn(
                          "hover:bg-slate-50",
                          selectedDetailIndex === idx ? 'bg-purple-50' : ''
                        )}
                        onClick={() => setSelectedDetailIndex(idx)}
                      >
                        <TableCell className="text-center p-1 text-xs">{idx + 1}</TableCell>
                        <TableCell className="p-1">
                          <div className="flex gap-1">
                            <Input className="h-7 text-xs flex-1" value={d.itemCd || ''} onChange={(e) => handleDetailChange(d.seqNo, 'itemCd', e.target.value)} />
                            <Button variant="outline" className="h-7 w-7 p-0 flex-shrink-0" onClick={() => { setItemModalTarget({ type: 'detail', seqNo: d.seqNo }); setItemModalOpen(true); }}>
                              <Search className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs bg-slate-50" value={d.itemName || ''} readOnly /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs bg-slate-50" value={d.std || ''} readOnly /></TableCell>
                        <TableCell className="p-1"><Input type="number" className="h-7 text-xs text-center" value={d.prcRealQty || 0} onChange={(e) => handleDetailChange(d.seqNo, 'prcRealQty', Number(e.target.value))} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" /></TableCell>
                        <TableCell className="p-1">
                          <div className="flex gap-1">
                            <Input className="h-7 text-xs flex-1" />
                            <Button variant="outline" className="h-7 w-7 p-0 flex-shrink-0"><Search className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="p-1">
                          <select className="h-7 text-xs border rounded w-full px-1" value={d.dayNight || 'D'} onChange={(e) => handleDetailChange(d.seqNo, 'dayNight', e.target.value)}>
                            <option value="D">주</option>
                            <option value="N">야</option>
                          </select>
                        </TableCell>
                        <TableCell className="p-1"><Input type="number" className="h-7 text-xs text-right" defaultValue={0} /></TableCell>
                        <TableCell className="p-1"><Input type="number" className="h-7 text-xs text-right" defaultValue={0} /></TableCell>
                        <TableCell className="p-1">
                          <select className="h-7 text-xs border rounded w-full px-1" value={d.inOutTag || '1'} onChange={(e) => handleDetailChange(d.seqNo, 'inOutTag', e.target.value)}>
                            <option value="1">사내</option>
                            <option value="2">외주</option>
                          </select>
                        </TableCell>
                        <TableCell className="p-1"><Input type="number" className="h-7 text-xs text-right text-red-500" value={d.badQty || 0} onChange={(e) => handleDetailChange(d.seqNo, 'badQty', Number(e.target.value))} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
