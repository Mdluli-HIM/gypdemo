export type UserRole = "owner" | "admin" | "manager" | "staff" | "trainer";

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: {
    path: string;
    message: string;
  }[];
};

export type LoginResponseData = {
  token: string;
  user: AuthUser;
};

export type ActivityMember = {
  _id: string;
  memberCode?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type ActivitySubscription = {
  _id: string;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  paymentStatus?: string;
  planSnapshot?: {
    name?: string;
    type?: string;
    price?: number;
    durationInDays?: number;
  };
};

export type RecentPayment = {
  _id: string;
  receiptNumber: string;
  amount: number;
  method: string;
  status: string;
  paidAt?: string;
  createdAt: string;
  member?: ActivityMember;
  subscription?: ActivitySubscription;
  receivedBy?: {
    name?: string;
    email?: string;
    role?: string;
  };
};

export type RecentCheckIn = {
  _id: string;
  entryStatus: "allowed" | "warning" | "blocked";
  decisionCode: string;
  message: string;
  checkedInAt: string;
  member?: ActivityMember;
  subscription?: ActivitySubscription;
  checkedInBy?: {
    name?: string;
    email?: string;
    role?: string;
  };
};

export type PendingReminder = {
  _id: string;
  type: string;
  channel: string;
  status: string;
  scheduledFor: string;
  message: string;
  phone: string;
  whatsappUrl?: string;
  member?: ActivityMember;
  subscription?: ActivitySubscription;
};

export type DashboardReport = {
  revenue: {
    today: {
      totalRevenue: number;
      totalPayments: number;
      startDate: string;
      endDate: string;
    };
    week: {
      totalRevenue: number;
      totalPayments: number;
      startDate: string;
      endDate: string;
    };
    month: {
      totalRevenue: number;
      totalPayments: number;
      startDate: string;
      endDate: string;
    };
    pending: {
      totalPendingAmount: number;
      totalPendingPayments: number;
    };
  };

  members: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    suspendedMembers: number;
    newMembersThisMonth: number;
  };

  subscriptions: {
    activeSubscriptions: number;
    scheduledSubscriptions: number;
    expiredSubscriptions: number;
    cancelledSubscriptions: number;
    suspendedSubscriptions: number;
    unpaidSubscriptions: number;
    partialSubscriptions: number;
    paidSubscriptions: number;
    expiringSoonSubscriptions: number;
  };

  checkInsToday: {
    totalAttempts: number;
    successfulEntries: number;
    uniqueSuccessfulMembers: number;
    allowedCount: number;
    warningCount: number;
    blockedCount: number;
    byDecisionCode: {
      decisionCode: string;
      count: number;
    }[];
  };

  reminders: {
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  };

  activity: {
    recentPayments: RecentPayment[];
    recentCheckIns: RecentCheckIn[];
    pendingReminders: PendingReminder[];
  };
};

export type MemberStatus = "active" | "inactive" | "suspended";

export type Member = {
  _id: string;
  id?: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  dateOfBirth?: string;
  status: MemberStatus;
  profilePhotoUrl?: string;
  notes?: string;
  joinedAt?: string;
  createdAt: string;
  updatedAt: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  address?: {
    street?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
};

export type MembersResponseData = {
  members: Member[];
};

export type CreateMemberPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  dateOfBirth?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  address?: {
    street?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  notes?: string;
};

export type CreateMemberResponseData = {
  member: Member;
};

export type EntryStatus = "allowed" | "warning" | "blocked";

export type CheckInMember = {
  _id: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  status: string;
};

export type CheckInSubscription = {
  _id: string;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  paymentStatus?: string;
  gracePeriodDays?: number;
  planSnapshot?: {
    name?: string;
    type?: string;
    price?: number;
    durationInDays?: number;
  };
};

export type PaymentSummary = {
  totalPaid: number;
  subscriptionPrice: number;
  balanceDue: number;
  paymentStatus: string;
};

export type EntryDecision = {
  entryStatus: EntryStatus;
  decisionCode: string;
  message: string;
  alreadyCheckedInToday: boolean;
  member: CheckInMember;
  subscription?: CheckInSubscription | null;
  paymentSummary?: PaymentSummary | null;
};

export type CheckInLookupResult = {
  member: CheckInMember;
  decision: {
    entryStatus: EntryStatus;
    decisionCode: string;
    message: string;
    alreadyCheckedInToday: boolean;
    paymentSummary?: PaymentSummary | null;
  };
};

export type CheckInLookupResponseData = {
  results: CheckInLookupResult[];
};

export type CheckInRecord = {
  _id: string;
  member: CheckInMember;
  subscription?: CheckInSubscription | null;
  checkedInAt: string;
  entryStatus: EntryStatus;
  decisionCode: string;
  message: string;
  alreadyCheckedInToday: boolean;
  notes?: string;
  checkedInBy?: {
    name?: string;
    email?: string;
    role?: string;
  };
};

export type CreateCheckInResponseData = {
  checkIn: CheckInRecord;
  decision: {
    entryStatus: EntryStatus;
    decisionCode: string;
    message: string;
    alreadyCheckedInToday: boolean;
    paymentSummary?: PaymentSummary | null;
  };
};

export type TodayCheckInsResponseData = {
  date: string;
  checkIns: CheckInRecord[];
};

export type CheckInSummaryResponseData = {
  today: {
    date: string;
    totalAttempts: number;
    successfulEntries: number;
    uniqueSuccessfulMembers: number;
    allowedCount: number;
    warningCount: number;
    blockedCount: number;
    byDecisionCode: {
      decisionCode: string;
      count: number;
    }[];
    latestCheckIns: CheckInRecord[];
  };
};

export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type PaymentMethod = "cash" | "card" | "eft" | "bank_transfer" | "other";

export type PaymentMember = {
  _id: string;
  memberCode?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  status?: string;
};

export type PaymentSubscription = {
  _id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
  planSnapshot: {
    name: string;
    type: string;
    price: number;
    durationInDays: number;
  };
  member?: PaymentMember;
};

export type Payment = {
  _id: string;
  receiptNumber: string;
  member: PaymentMember;
  subscription: PaymentSubscription;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  receivedBy?: {
    name?: string;
    email?: string;
    role?: string;
  };
};

export type PaymentsResponseData = {
  payments: Payment[];
};

export type PaymentSummaryResponseData = {
  today: {
    totalRevenue: number;
    totalPayments: number;
    startDate: string;
    endDate: string;
  };
  week: {
    totalRevenue: number;
    totalPayments: number;
    startDate: string;
    endDate: string;
  };
  month: {
    totalRevenue: number;
    totalPayments: number;
    startDate: string;
    endDate: string;
    byMethod: {
      method: string;
      totalRevenue: number;
      totalPayments: number;
    }[];
  };
};

export type SubscriptionsResponseData = {
  subscriptions: PaymentSubscription[];
};

export type CreatePaymentPayload = {
  subscriptionId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  notes?: string;
};

export type CreatePaymentResponseData = {
  payment: Payment;
  subscriptionPaymentSummary: {
    totalPaid: number;
    subscriptionPrice: number;
    balanceDue: number;
    paymentStatus: string;
  };
};

export type MembershipPlanType = "daily" | "weekly" | "monthly" | "custom";

export type MembershipPlan = {
  _id: string;
  name: string;
  type: MembershipPlanType;
  price: number;
  durationInDays: number;
  description?: string;
  benefits?: string[];
  isActive: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name?: string;
    email?: string;
    role?: string;
  };
  updatedBy?: {
    name?: string;
    email?: string;
    role?: string;
  };
};

export type MembershipPlansResponseData = {
  plans: MembershipPlan[];
};

export type CreateMembershipPlanPayload = {
  name: string;
  type: MembershipPlanType;
  price: number;
  durationInDays: number;
  description?: string;
  benefits?: string[];
  displayOrder?: number;
};

export type CreateMembershipPlanResponseData = {
  plan: MembershipPlan;
};

export type ReminderStatus = "pending" | "sent" | "failed" | "cancelled";

export type ReminderType =
  | "expiry_3_days"
  | "expiry_1_day"
  | "expiry_today"
  | "expired"
  | "payment_due"
  | "partial_payment";

export type ReminderChannel =
  | "manual_whatsapp"
  | "manual_call"
  | "sms"
  | "email";

export type ReminderMember = {
  _id: string;
  memberCode?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  status?: string;
};

export type ReminderSubscription = {
  _id: string;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  paymentStatus?: string;
  gracePeriodDays?: number;
  planSnapshot?: {
    name?: string;
    type?: string;
    price?: number;
    durationInDays?: number;
  };
};

export type Reminder = {
  _id: string;
  type: ReminderType;
  channel: ReminderChannel;
  status: ReminderStatus;
  scheduledFor: string;
  message: string;
  phone: string;
  whatsappUrl?: string;
  sentAt?: string | null;
  failedAt?: string | null;
  failureReason?: string;
  cancelledAt?: string | null;
  notes?: string;

  member?: ReminderMember;
  subscription?: ReminderSubscription;

  memberSnapshot?: {
    memberCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    status?: string;
  };

  subscriptionSnapshot?: {
    status?: string;
    paymentStatus?: string;
    planName?: string;
    planPrice?: number;
    startsAt?: string;
    endsAt?: string;
    gracePeriodDays?: number;
  };
};
