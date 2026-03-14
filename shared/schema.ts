import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// 기존 ERP 연동 테이블 (Core Items)
// ==========================================

// 품목 마스터 (간소화)
export const itemMst = pgTable("item_mst", {
  itemCd: varchar("item_cd", { length: 40 }).primaryKey(),
  itemName: varchar("item_name", { length: 60 }).notNull(),
  std: varchar("std", { length: 60 }), // 규격
  unitCd: varchar("unit_cd", { length: 5 }), // 단위
});

// 사원 마스터 (간소화)
export const empMst = pgTable("emp_mst", {
  empId: varchar("emp_id", { length: 10 }).primaryKey(),
  empName: varchar("emp_name", { length: 20 }).notNull(),
  deptName: varchar("dept_name", { length: 30 }),
});

// ==========================================
// 신규: AI 비전 검사 시스템 테이블
// ==========================================

// 1. 작업지시/실적 테이블 (Work Order / Performance)
// ERP의 생산 실적과 연결되는 핵심 테이블
export const workPerformances = pgTable("work_performances", {
  id: serial("id").primaryKey(),
  workOrderNo: varchar("work_order_no", { length: 20 }).notNull(), // 작업지시번호
  itemCd: varchar("item_cd", { length: 40 }).references(() => itemMst.itemCd), // 품목코드
  empId: varchar("emp_id", { length: 10 }).references(() => empMst.empId), // 작업자
  workDate: timestamp("work_date").defaultNow(), // 작업일시
  planQty: integer("plan_qty").default(0), // 지시수량
  prodQty: integer("prod_qty").default(0), // 생산수량 (양품)
  badQty: integer("bad_qty").default(0), // 불량수량
  status: varchar("status", { length: 10 }).default("RUNNING"), // 상태: RUNNING, STOP, FINISH
});

// 2. AI 비전 검사 로그 (AI Vision Inspection Logs)
// 카메라에서 스캔된 개별 제품의 검사 결과
export const aiVisionLogs = pgTable("ai_vision_logs", {
  id: serial("id").primaryKey(),
  workPerformanceId: integer("work_performance_id").references(() => workPerformances.id), // 작업실적 ID 연결
  barcode: varchar("barcode", { length: 50 }), // 스캔된 QR/바코드
  scanTime: timestamp("scan_time").defaultNow(), // 스캔 시간
  
  // 검사 결과
  result: varchar("result", { length: 2 }).notNull(), // 'OK' or 'NG'
  defectType: varchar("defect_type", { length: 20 }), // 결함 유형: 'Crack', 'Scratch', 'Dent', 'Missing', 'Normal'
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }), // AI 신뢰도 (0~100%)
  
  // 이미지 데이터
  imageUrl: text("image_url"), // 원본/검사 이미지 URL (S3 or Local Path)
  overlayUrl: text("overlay_url"), // 바운딩 박스 처리된 이미지 URL
  
  // 분석 메타데이터
  cameraIp: varchar("camera_ip", { length: 20 }),
  processingTimeMs: integer("processing_time_ms"), // 처리 시간(ms)
});

// Zod Schemas for API Validation
export const insertWorkPerformanceSchema = createInsertSchema(workPerformances);
export const insertAiVisionLogSchema = createInsertSchema(aiVisionLogs);

export type ItemMst = typeof itemMst.$inferSelect;
export type WorkPerformance = typeof workPerformances.$inferSelect;
export type AiVisionLog = typeof aiVisionLogs.$inferSelect;

