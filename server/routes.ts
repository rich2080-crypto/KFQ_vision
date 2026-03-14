import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { aiVisionLogs, workPerformances, itemMst, empMst } from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  
  // ==========================================
  // 데이터 초기화 (Seeding) - 데모용
  // ==========================================
  app.post("/api/seed", async (req: Request, res: Response) => {
    try {
      // 1. 품목 기초 데이터
      await db.insert(itemMst).values([
        { itemCd: "PART-001", itemName: "자동차 엔진 피스톤 A", std: "Aluminum Alloy", unitCd: "EA" },
        { itemCd: "PART-002", itemName: "브레이크 패드 V2", std: "Ceramic Composite", unitCd: "EA" },
        { itemCd: "PART-003", itemName: "전조등 하우징", std: "Polycarbonate", unitCd: "EA" },
      ]).onConflictDoNothing();

      // 2. 사원 기초 데이터
      await db.insert(empMst).values([
        { empId: "EMP-001", empName: "김철수", deptName: "생산1팀" },
        { empId: "EMP-002", empName: "이영희", deptName: "품질관리팀" },
      ]).onConflictDoNothing();

      // 3. 작업 실적 생성
      const [performance] = await db.insert(workPerformances).values({
        workOrderNo: "WO-20250313-01",
        itemCd: "PART-001",
        empId: "EMP-001",
        planQty: 1000,
        prodQty: 0,
        badQty: 0,
        status: "RUNNING",
      }).returning();

      // 4. AI 비전 로그 샘플 생성 (랜덤)
      const logs = [];
      const defectTypes = ["Normal", "Crack", "Scratch", "Dent", "Stain"];
      
      for (let i = 0; i < 50; i++) {
        const isDefect = Math.random() < 0.15; // 15% 불량률
        const type = isDefect ? defectTypes[Math.floor(Math.random() * 4) + 1] : "Normal";
        
        logs.push({
          workPerformanceId: performance.id,
          barcode: `BC-${Date.now()}-${i}`,
          result: isDefect ? "NG" : "OK",
          defectType: isDefect ? type : null,
          confidenceScore: (Math.random() * (99.9 - 85.0) + 85.0).toFixed(2), // 85~99.9%
          imageUrl: isDefect 
            ? "https://placehold.co/600x400/ff0000/white?text=Defect+Detected" 
            : "https://placehold.co/600x400/00ff00/white?text=OK",
          processingTimeMs: Math.floor(Math.random() * 200) + 50,
          scanTime: new Date(Date.now() - i * 60000), // 1분 간격 역순
        });
      }

      await db.insert(aiVisionLogs).values(logs);

      res.json({ message: "Sample data created successfully", performanceId: performance.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to seed data", error });
    }
  });

  // ==========================================
  // API Endpoints
  // ==========================================

  // 1. 실시간 검사 로그 조회
  app.get("/api/vision/logs", async (req: Request, res: Response) => {
    try {
      const logs = await db.select({
        id: aiVisionLogs.id,
        time: aiVisionLogs.scanTime,
        barcode: aiVisionLogs.barcode,
        result: aiVisionLogs.result,
        defectType: aiVisionLogs.defectType,
        confidence: aiVisionLogs.confidenceScore,
        image: aiVisionLogs.imageUrl,
        itemName: itemMst.itemName,
      })
      .from(aiVisionLogs)
      .leftJoin(workPerformances, eq(aiVisionLogs.workPerformanceId, workPerformances.id))
      .leftJoin(itemMst, eq(workPerformances.itemCd, itemMst.itemCd))
      .orderBy(desc(aiVisionLogs.scanTime))
      .limit(50);
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching logs" });
    }
  });

  // 2. 대시보드 통계 조회
  app.get("/api/vision/stats", async (req: Request, res: Response) => {
    try {
      // 전체 검사 수량
      const totalCount = await db.select({ count: sql<number>`count(*)` }).from(aiVisionLogs);
      
      // 불량 수량
      const ngCount = await db.select({ count: sql<number>`count(*)` })
        .from(aiVisionLogs)
        .where(eq(aiVisionLogs.result, "NG"));

      // 유형별 불량 분포
      const defectDistribution = await db.select({
        type: aiVisionLogs.defectType,
        count: sql<number>`count(*)`,
      })
      .from(aiVisionLogs)
      .where(eq(aiVisionLogs.result, "NG"))
      .groupBy(aiVisionLogs.defectType);

      // 시간대별 불량 추이 (최근 10건)
      const recentTrend = await db.select({
        time: aiVisionLogs.scanTime,
        result: aiVisionLogs.result,
      })
      .from(aiVisionLogs)
      .orderBy(desc(aiVisionLogs.scanTime))
      .limit(20);

      res.json({
        total: totalCount[0].count,
        ng: ngCount[0].count,
        ok: Number(totalCount[0].count) - Number(ngCount[0].count),
        distribution: defectDistribution,
        trend: recentTrend
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

