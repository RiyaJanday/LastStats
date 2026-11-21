// All the data shapes used across the app

export interface User {
  id: string
  email: string
  fullName: string
  role: string
}

export interface Holding {
  id: string
  fundIsin: string
  fundName: string
  fundCategory: string
  units: number
  avgNav: number
  currentNav: number
  investedAmount: number
  currentValue: number
  gain: number
  gainPercent: number
}

export interface Portfolio {
  id: string
  name: string
  totalInvested: number
  currentValue: number
  totalGain: number
  totalGainPercent: number
  holdingsCount: number
  holdings: Holding[]
}

export interface SipPlan {
  id: string
  fundIsin: string
  fundName: string
  monthlyAmount: number
  sipDate: number
  startDate: string
  isActive: boolean
  totalInvested: number
  installmentsCount: number
  projectedValue5Y: number
}
