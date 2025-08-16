import type { User, PurchaseRecord } from "./types"
import { getUserProfile, saveUserProfile } from "./user-storage"

const EXAM_PRICE = 25 // $25 per exam

export function hasExamAccess(examId: string): boolean {
  const user = getUserProfile()
  return user.purchasedExams?.includes(examId) || false
}

export function purchaseExam(examId: string, examTitle: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate payment processing
    setTimeout(() => {
      const user = getUserProfile()
      const purchaseRecord: PurchaseRecord = {
        examId,
        purchaseDate: new Date().toISOString(),
        amount: EXAM_PRICE,
        paymentMethod: "Credit Card",
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }

      const updatedUser: User = {
        ...user,
        purchasedExams: [...(user.purchasedExams || []), examId],
        purchaseHistory: [...(user.purchaseHistory || []), purchaseRecord],
      }

      saveUserProfile(updatedUser)
      resolve(true)
    }, 2000) // Simulate 2 second payment processing
  })
}

export function getExamPrice(): number {
  return EXAM_PRICE
}

export function getPurchaseHistory(): PurchaseRecord[] {
  const user = getUserProfile()
  return user.purchaseHistory || []
}
