import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Search, Plus, Trash2, Camera, Power, X, ChevronRight, Save, RotateCcw, Printer } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// ==========================================
// Types & Interfaces (Ported from ERP)
// ==========================================

interface ProcessItem {
  prcCd: string;
  prcName: string;
  prcKind: string; // 1:Start, 2:Middle, 3:Finish
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
  prcActDt: string;
  isEnd: string;
  inSt: number;
  emp1: string;
  emp2: string;
  emp3: string;
  hogi: string;
  lotNo: string;
  endEtc: string | null;
  scmTagIn: string;
}

interface WorkResultDetail {
  seqNo: number;
  odCd: string;
  prcOdCd: string;
  odItemSeq: string;
  prcCd: string;
  prcSeq: string;
  itemCd: string;
  tItemCd: string;
  itemName: string;
  itemName2: string;
  std: string | null;
  prcQty: number;
  prcRealQty: number;
  conQty: number;
  badQty: number;
  dvcCd: string;
  dvcName: string;
  dvcCd2: string;
  dvcName2: string;
  pfTag: string;
  userOdCd: string;
  bigo: string | null;
  preQty: number;
  totQty: number;
  realQty: number;
  overQty: number;
  realQty2: number;
  overQty2: number;
  pfEndTag: string;
  qaTag: string;
  isEnd: string;
  scmTagIn: string;
  dayNight: string;
  workTime: number;
  tonDanga: number;
  totTonPrice: number;
  inOutTag: string;
}

interface BadDetail {
  seqNo: number;
  prcOdCd: string;
  odItemSeq: string;
  itemCd: string;
  itemName: string;
  tItemCd: string;
  badQty: number;
  conQty: number;
  badCd: string;
  badName: string;
  etc: string | null;
  dvcCd: string;
}

interface BomTreeItem {
  moPtNo: string;
  chPtNo: string;
  itemName: string;
  std: string | null;
  unitName: string | null;
  unitSoyo: number;
  totSoyo: number;
  lvl: number;
  loss: number;
  lossDiv: string;
  bomSeq: number;
  path: string;
}

// ==========================================
// Mock Data & Helpers
// ==========================================

const initialFormData: Partial<WorkResult> = {
  prcOdCd: '', prcCd: '', prcName: '', prcDt: '', prcOdUserCd: '',
  prcActDt: new Date().toISOString().split('T')[0].replace(/-/g, ''),
  mainEmpId: '', isEnd: '2', inSt: 0, emp1: '', emp2: '', emp3: '',
  hogi: '', lotNo: '', endEtc: '', scmTagIn: 'N',
};

const emptyDetailForm: Partial<WorkResultDetail> = {
  seqNo: 0, odCd: '', prcOdCd: '', odItemSeq: '', prcCd: '', prcSeq: '',
  itemCd: '', tItemCd: '', itemName: '', itemName2: '', std: '', prcQty: 0, prcRealQty: 0, conQty: 0, badQty: 0,
  dvcCd: '', dvcName: '', dvcCd2: '', dvcName2: '', pfTag: '1', userOdCd: '', bigo: '', preQty: 0, totQty: 0,
  realQty: 0, overQty: 0, realQty2: 0, overQty2: 0, pfEndTag: 'N', qaTag: 'N', isEnd: '2', scmTagIn: 'N',
  dayNight: 'D', workTime: 0, tonDanga: 0, totTonPrice: 0, inOutTag: '1',
};

const emptyBadForm: Partial<BadDetail> = {
  seqNo: 0, prcOdCd: '', odItemSeq: '', itemCd: '', itemName: '', tItemCd: '',
  badQty: 0, conQty: 0, badCd: '', badName: '', etc: '', dvcCd: '',
};

const mockProcessList: ProcessItem[] = [
  { prcCd: 'PRC001', prcName: '주조 공정', prcKind: '1', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: 'PRC002', prcName: '가공 공정', prcKind: '2', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: 'PRC003', prcName: '조립 공정', prcKind: '3', prcOdChk: 'Y', areaId: 'A001' },
  { prcCd: 'PRC004', prcName: '검사 공정', prcKind: '3', prcOdChk: 'Y', areaId: 'A001' },
];

const mockItems = [
  { itemCd: 'PART-001', itemName: '엔진 피스톤 A', std: 'AL-Alloy' },
  { itemCd: 'PART-002', itemName: '브레이크 패드', std: 'Ceramic' },
  { itemCd: 'PART-003', itemName: '전조등 하우징', std: 'PC' },
];

// ==========================================
// Components: Simple Modals
// ==========================================

const SimpleSearchModal = ({ 
  isOpen, 
  onClose, 
  title, 
  data, 
  onSelect,
  columns 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  data: any[]; 
  onSelect: (item: any) => void;
  columns: { key: string; label: string }[];
}) => {
  const [search, setSearch] = useState('');
  
  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="검색어 입력..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <Button variant="outline"><Search className="w-4 h-4" /></Button>
        </div>
        <div className="max-h-[300px] overflow-y-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => <TableHead key={col.key}>{col.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, idx) => (
                <TableRow 
                  key={idx} 
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => { onSelect(item); onClose(); }}
                >
                  {columns.map(col => (
                    <TableCell key={col.key}>{item[col.key]}</TableCell>
                  ))}
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow><TableCell colSpan={columns.length} className="text-center">데이터 없음</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
  const [badDetails, setBadDetails] = useState<BadDetail[]>([]);
  const [selectedPrcOdCd, setSelectedPrcOdCd] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selectedDetailIndex, setSelectedDetailIndex] = useState<number | null>(null);
  const [selectedBadIndex, setSelectedBadIndex] = useState<number | null>(null);
  const [selectedProcessIdx, setSelectedProcessIdx] = useState<number | null>(null);
  const [workResultList, setWorkResultList] = useState<any[]>([]);
  
  // Modals State
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalTarget, setItemModalTarget] = useState<{ type: 'detail' | 'bad'; seqNo: number }>({ type: 'detail', seqNo: 0 });
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [barcodeAutoMode, setBarcodeAutoMode] = useState(false);

  const mesVideoRef = useRef<HTMLVideoElement>(null);
  const mesCodeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Load Work Result List (Mock)
  const loadWorkResultList = useCallback(async () => {
    // In real implementation, fetch from API
    // For now, use empty list or mock
    setWorkResultList([]);
  }, [searchDate]);

  useEffect(() => {
    loadWorkResultList();
  }, [loadWorkResultList]);

  // Handlers
  const handleNew = () => {
    const currentPrcCd = formData.prcCd;
    const currentPrcName = formData.prcName;
    
    setFormData({
      ...initialFormData,
      prcOdCd: `WO-${Date.now()}`,
      prcOdUserCd: `WO-${Date.now()}`,
      prcCd: currentPrcCd || '',
      prcName: currentPrcName || '',
      prcActDt: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    });
    setDetails([]);
    setBadDetails([]);
    setIsNew(true);
    setSelectedPrcOdCd(null);
    toast({ title: "신규 작성", description: "새로운 작업실적을 입력합니다." });
  };

  const handleSave = () => {
    if (!formData.prcCd) {
      toast({ variant: "destructive", title: "오류", description: "공정을 먼저 선택해주세요." });
      return;
    }
    // API Call Mock
    setTimeout(() => {
      toast({ title: "저장 완료", description: "작업실적이 저장되었습니다." });
      setIsNew(false);
      // Add to workResultList mock
      setWorkResultList(prev => [...prev, { ...formData, details, badDetails }]);
    }, 500);
  };

  const handleSelectProcess = (idx: number) => {
    setSelectedProcessIdx(idx);
    const proc = mockProcessList[idx];
    setFormData(prev => ({
      ...prev,
      prcCd: proc.prcCd,
      prcName: proc.prcName,
    }));
    // In real app: fetch work results for this process
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

  const handleItemSelect = (item: any) => {
    if (itemModalTarget.type === 'detail') {
      setDetails(prev => prev.map(d =>
        d.seqNo === itemModalTarget.seqNo ? { ...d, itemCd: item.itemCd, itemName: item.itemName, std: item.std } : d
      ));
    } else {
      setBadDetails(prev => prev.map(b =>
        b.seqNo === itemModalTarget.seqNo ? { ...b, itemCd: item.itemCd, itemName: item.itemName, tItemCd: item.itemCd } : b
      ));
    }
  };

  const handleBarcodeScan = useCallback((barcode: string) => {
    if (!barcode) return;
    toast({ title: "바코드 스캔됨", description: barcode });
    
    // Find matching item (Mock)
    const matchedItem = mockItems.find(i => i.itemCd === barcode) || { itemCd: barcode, itemName: '스캔품목', std: 'Unknown' };

    setDetails(prev => {
      // Find empty row
      const emptyIdx = prev.findIndex(d => !d.itemCd);
      if (emptyIdx >= 0) {
        return prev.map((d, idx) => idx === emptyIdx ? { ...d, itemCd: matchedItem.itemCd, itemName: matchedItem.itemName, std: matchedItem.std } : d);
      } else {
        const newSeqNo = prev.length > 0 ? Math.max(...prev.map(d => d.seqNo)) + 1 : 1;
        return [...prev, { 
          ...emptyDetailForm, 
          seqNo: newSeqNo, 
          itemCd: matchedItem.itemCd, 
          itemName: matchedItem.itemName, 
          std: matchedItem.std,
          prcCd: formData.prcCd || '' 
        } as WorkResultDetail];
      }
    });

    if (!barcodeAutoMode) {
      setBarcodeScannerOpen(false);
    }
  }, [formData.prcCd, barcodeAutoMode, toast]);

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

    if (mesVideoRef.current) {
      codeReader.decodeFromVideoDevice(null, mesVideoRef.current, (result, error) => {
        if (result) {
          handleBarcodeScan(result.getText());
        }
      }).catch(err => console.error(err));
    }

    return () => {
      codeReader.reset();
    };
  }, [barcodeScannerOpen, handleBarcodeScan]);

  return (
    <div className="min-h-screen flex flex-col p-2 bg-slate-50 text-sm">
      {/* Search Modals */}
      <SimpleSearchModal 
        isOpen={itemModalOpen} 
        onClose={() => setItemModalOpen(false)} 
        title="품목 검색" 
        data={mockItems} 
        onSelect={handleItemSelect}
        columns={[{ key: 'itemCd', label: '품목코드' }, { key: 'itemName', label: '품목명' }, { key: 'std', label: '규격' }]}
      />

      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border mb-2 shadow-sm">
        <div className="flex items-center gap-2 border-r pr-3 mr-1">
          <ClipboardCheck className="w-5 h-5 text-green-600" />
          <span className="font-bold text-slate-800">작업실적 등록</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Input 
            type="date" 
            value={searchDate} 
            onChange={(e) => setSearchDate(e.target.value)} 
            className="w-32 h-8 text-xs"
          />
          <Button size="sm" variant="outline" className="h-8" onClick={loadWorkResultList}>
            <Search className="w-3 h-3 mr-1" /> 조회
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" variant="outline" className="h-8" onClick={handleNew}>
            <RotateCcw className="w-3 h-3 mr-1" /> 신규
          </Button>
          <Button size="sm" className="h-8" onClick={handleSave}>
            <Save className="w-3 h-3 mr-1" /> 저장
          </Button>
          <Button size="sm" variant="destructive" className="h-8">
            <Trash2 className="w-3 h-3 mr-1" /> 삭제
          </Button>
          <Button size="sm" variant="outline" className="h-8">
            <Printer className="w-3 h-3 mr-1" /> 인쇄
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-2 flex-1">
        
        {/* Left Side: Process List & Camera */}
        <div className="w-full lg:w-[280px] flex flex-col gap-2">
          {/* Process List */}
          <Card className="flex-1 max-h-[400px]">
            <CardHeader className="p-2 bg-slate-100 border-b">
              <CardTitle className="text-xs font-semibold">작업공정 목록</CardTitle>
            </CardHeader>
            <div className="overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center p-1">No</TableHead>
                    <TableHead className="p-1">공정명</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProcessList.map((proc, idx) => (
                    <TableRow 
                      key={proc.prcCd} 
                      className={`cursor-pointer ${selectedProcessIdx === idx ? 'bg-blue-100' : ''}`}
                      onClick={() => handleSelectProcess(idx)}
                    >
                      <TableCell className="text-center p-1">{idx + 1}</TableCell>
                      <TableCell className="p-1 font-medium">
                        {proc.prcName}
                        <div className="text-[10px] text-slate-400">{proc.prcCd}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* MES Camera */}
          <Card className="aspect-square flex flex-col overflow-hidden">
            <div className="p-2 bg-slate-100 border-b flex justify-between items-center">
              <span className="text-xs font-semibold flex gap-1 items-center"><Camera className="w-3 h-3"/> MES 스캔</span>
              {!barcodeScannerOpen ? (
                <Button size="icon" className="h-6 w-6" onClick={() => setBarcodeScannerOpen(true)}>
                  <Power className="w-3 h-3" />
                </Button>
              ) : (
                <Button size="icon" variant="destructive" className="h-6 w-6" onClick={() => setBarcodeScannerOpen(false)}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex-1 bg-black relative flex items-center justify-center">
              {barcodeScannerOpen ? (
                <video ref={mesVideoRef} className="w-full h-full object-cover" />
              ) : (
                <div 
                  className="text-slate-400 text-center cursor-pointer" 
                  onClick={() => setBarcodeScannerOpen(true)}
                >
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">터치하여 스캔 시작</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Master & Detail */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Master Info Form */}
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">작업공정</Label>
                  <div className="flex gap-1">
                    <Input className="w-20 h-7 text-xs bg-slate-100" value={formData.prcCd || ''} readOnly />
                    <Input className="w-32 h-7 text-xs bg-slate-100" value={formData.prcName || ''} readOnly />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-red-500">작업일자</Label>
                  <Input type="date" className="w-32 h-7 text-xs" 
                    value={formData.prcActDt ? `${formData.prcActDt.slice(0,4)}-${formData.prcActDt.slice(4,6)}-${formData.prcActDt.slice(6,8)}` : ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, prcActDt: e.target.value.replace(/-/g, '') }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">작업지시자</Label>
                  <div className="flex gap-1">
                    <Input className="w-20 h-7 text-xs" value={formData.mainEmpId || ''} onChange={(e) => setFormData(prev => ({...prev, mainEmpId: e.target.value}))} />
                    <Button variant="outline" className="h-7 w-7 p-0"><Search className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail Grid */}
          <Card className="flex-1 flex flex-col min-h-[300px]">
            <CardHeader className="p-2 bg-slate-100 border-b flex flex-row justify-between items-center">
              <CardTitle className="text-xs font-semibold">생산실적 상세내역</CardTitle>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={addDetailRow}><Plus className="w-3 h-3 mr-1" /> 추가</Button>
                <Button size="sm" variant="destructive" className="h-6 text-xs" onClick={() => selectedDetailIndex !== null && removeDetailRow(details[selectedDetailIndex].seqNo)} disabled={selectedDetailIndex === null}>
                  <Trash2 className="w-3 h-3 mr-1" /> 삭제
                </Button>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 text-center p-1">No</TableHead>
                    <TableHead className="p-1 min-w-[100px]">품목코드</TableHead>
                    <TableHead className="p-1 min-w-[150px]">품목명</TableHead>
                    <TableHead className="p-1 min-w-[100px]">규격</TableHead>
                    <TableHead className="p-1 w-20 text-right">실적수량</TableHead>
                    <TableHead className="p-1 w-20 text-right">불량수량</TableHead>
                    <TableHead className="p-1 min-w-[100px]">비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center h-24 text-slate-400">데이터가 없습니다. 추가 버튼을 눌러주세요.</TableCell></TableRow>
                  ) : (
                    details.map((d, idx) => (
                      <TableRow 
                        key={d.seqNo} 
                        className={`hover:bg-slate-50 ${selectedDetailIndex === idx ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedDetailIndex(idx)}
                      >
                        <TableCell className="text-center p-1">{idx + 1}</TableCell>
                        <TableCell className="p-1">
                          <div className="flex gap-1">
                            <Input className="h-7 text-xs" value={d.itemCd || ''} onChange={(e) => handleDetailChange(d.seqNo, 'itemCd', e.target.value)} />
                            <Button variant="outline" className="h-7 w-7 p-0" onClick={() => { setItemModalTarget({ type: 'detail', seqNo: d.seqNo }); setItemModalOpen(true); }}><Search className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs bg-slate-50" value={d.itemName || ''} readOnly /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs bg-slate-50" value={d.std || ''} readOnly /></TableCell>
                        <TableCell className="p-1"><Input type="number" className="h-7 text-xs text-right" value={d.prcRealQty || 0} onChange={(e) => handleDetailChange(d.seqNo, 'prcRealQty', Number(e.target.value))} /></TableCell>
                        <TableCell className="p-1"><Input type="number" className="h-7 text-xs text-right text-red-500" value={d.badQty || 0} onChange={(e) => handleDetailChange(d.seqNo, 'badQty', Number(e.target.value))} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={d.bigo || ''} onChange={(e) => handleDetailChange(d.seqNo, 'bigo', e.target.value)} /></TableCell>
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

