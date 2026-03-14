import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Camera, RefreshCw, ZoomIn, Power, Play, Square } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Types
type VisionLog = {
  id: number;
  time: string;
  barcode: string;
  result: "OK" | "NG";
  defectType: string | null;
  confidence: string;
  image: string;
  itemName: string;
};

export default function VisionInspectionPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Polling for logs
  const { data: logs } = useQuery<VisionLog[]>({
    queryKey: ["/api/vision/logs"],
    refetchInterval: 2000, // 2초마다 갱신
  });

  // 웹캠 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsLive(true);
      }
    } catch (err) {
      console.error("Camera Error:", err);
      alert("카메라를 실행할 수 없습니다. 권한을 확인해주세요.");
    }
  };

  // 웹캠 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
  };

  // AI 분석 시뮬레이션 (랜덤 박스 그리기)
  useEffect(() => {
    let animationFrameId: number;

    const drawOverlay = () => {
      if (!isLive || !videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 캔버스 크기를 비디오 크기와 맞춤
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // 기존 그림 지우기
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 랜덤하게 검출 박스 그리기 (AI 인식 효과)
      if (Math.random() > 0.9) {
        const x = Math.random() * (canvas.width - 100);
        const y = Math.random() * (canvas.height - 100);
        
        ctx.strokeStyle = '#00ff00'; // 녹색 박스
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 100, 100);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';
        ctx.fillText(`Confidence: ${(Math.random() * 10 + 89).toFixed(1)}%`, x, y - 10);
      }

      animationFrameId = requestAnimationFrame(drawOverlay);
    };

    if (isLive) {
      drawOverlay();
    } else {
      cancelAnimationFrame(animationFrameId);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isLive]);

  // 컴포넌트 언마운트 시 카메라 정지
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">AI 비전 검사 모니터링</h2>
          <p className="text-slate-500">실시간 카메라 영상 분석 및 불량 감지 로그</p>
        </div>
        <div className="flex gap-2">
          {!isLive ? (
            <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              <Play className="w-4 h-4 mr-2" />
              카메라 연결 (Start)
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="destructive" className="shadow-md">
              <Square className="w-4 h-4 mr-2" />
              연결 종료 (Stop)
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Camera Feed */}
        <Card className="lg:col-span-2 border-slate-200 shadow-lg overflow-hidden">
          <CardHeader className="pb-3 bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="w-5 h-5 text-blue-600" /> 
              실시간 영상 분석 (Live Stream)
              {isLive && <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-black relative aspect-video flex items-center justify-center">
            {/* Video Element */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-contain ${!isLive ? 'hidden' : ''}`} 
            />
            
            {/* Canvas Overlay for AI Bounding Box */}
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none w-full h-full"
            />

            {/* Placeholder when camera is off */}
            {!isLive && (
              <div className="text-slate-500 flex flex-col items-center">
                <Camera className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">카메라가 꺼져 있습니다</p>
                <p className="text-sm opacity-70">우측 상단의 '카메라 연결' 버튼을 눌러주세요</p>
              </div>
            )}
            
            {/* Live Status Overlay */}
            {isLive && (
              <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                AI PROCESSING ACTIVE
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Stats & Quick Log */}
        <div className="space-y-6">
          <Card className="shadow-md border-slate-200">
            <CardHeader className="bg-slate-50 border-b py-3">
              <CardTitle className="text-sm font-bold text-slate-700">최근 판정 결과</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {logs?.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-10 rounded-full ${log.result === 'OK' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <div className={`font-bold text-sm ${log.result === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                          {log.result}
                        </div>
                        <div className="text-xs text-slate-500">{new Date(log.time).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-medium text-slate-700">{log.barcode}</div>
                      {log.defectType ? (
                         <div className="text-xs text-red-500 font-bold bg-red-50 px-1 rounded inline-block mt-0.5">{log.defectType}</div>
                      ) : (
                         <div className="text-xs text-green-500 font-medium">정상</div>
                      )}
                    </div>
                  </div>
                ))}
                {!logs?.length && (
                  <div className="p-8 text-center text-slate-400 text-sm">데이터가 없습니다.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Log Table */}
      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-slate-50 border-b py-4">
          <CardTitle className="text-lg font-bold text-slate-800">검사 이력 로그 (History)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[180px]">검사 시간</TableHead>
                <TableHead>캡처 이미지</TableHead>
                <TableHead>바코드 / QR</TableHead>
                <TableHead>품목명</TableHead>
                <TableHead>판정 결과</TableHead>
                <TableHead>결함 유형</TableHead>
                <TableHead>AI 신뢰도</TableHead>
                <TableHead className="text-right">상세보기</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id} className={`hover:bg-slate-50 ${log.result === 'NG' ? 'bg-red-50/30' : ''}`}>
                  <TableCell className="font-medium text-slate-600">
                    {new Date(log.time).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div 
                      className="w-16 h-10 bg-slate-200 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all border border-slate-300"
                      onClick={() => setSelectedImage(log.image)}
                    >
                      <img src={log.image} alt="thumb" className="w-full h-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.barcode}</TableCell>
                  <TableCell>{log.itemName}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                      log.result === 'OK' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                      {log.result}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.defectType ? (
                      <span className="text-red-600 font-semibold">{log.defectType}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${log.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600">{log.confidence}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedImage(log.image)}>
                      <ZoomIn className="w-4 h-4 text-slate-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-slate-100">검사 이미지 상세 보기</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-700">
            {selectedImage && (
              <img src={selectedImage} alt="Detail" className="max-w-full max-h-full object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
