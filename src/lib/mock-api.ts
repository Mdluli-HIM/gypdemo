type MockOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: HeadersInit;
};

type MockResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

type DemoMember = {
  _id: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
  };
  notes?: string;
};

type DemoPlan = {
  _id: string;
  name: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  price: number;
  durationInDays: number;
  description?: string;
  benefits?: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type DemoSubscription = {
  _id: string;
  member: string;
  plan: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "active" | "expired" | "cancelled" | "suspended";
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
  gracePeriodDays: number;
  notes?: string;
  planSnapshot: {
    name: string;
    type: string;
    price: number;
    durationInDays: number;
  };
  createdAt: string;
  updatedAt: string;
};

type DemoPayment = {
  _id: string;
  receiptNumber: string;
  reference: string;
  member: string;
  subscription: string;
  amount: number;
  method: "cash" | "card" | "eft" | "bank_transfer" | "other";
  status: "paid" | "pending" | "failed" | "refunded";
  paidAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  receivedBy?: {
    name?: string;
    email?: string;
    role?: string;
  };
};

type DemoCheckIn = {
  _id: string;
  member: string;
  subscription?: string;
  checkedInAt: string;
  entryStatus: "allowed" | "warning" | "blocked";
  decisionCode: string;
  message: string;
  notes?: string;
  createdAt: string;
};

type DemoReminder = {
  _id: string;
  type:
    | "expiry_3_days"
    | "expiry_1_day"
    | "expiry_today"
    | "expired"
    | "payment_due"
    | "partial_payment";
  channel: "manual_whatsapp" | "manual_call" | "sms" | "email";
  status: "pending" | "sent" | "failed" | "cancelled";
  scheduledFor: string;
  message: string;
  phone: string;
  whatsappUrl?: string;
  sentAt?: string | null;
  failedAt?: string | null;
  failureReason?: string;
  cancelledAt?: string | null;
  notes?: string;
  member: string;
  subscription?: string;
  createdAt: string;
  updatedAt: string;
};

type DemoDb = {
  members: DemoMember[];
  plans: DemoPlan[];
  subscriptions: DemoSubscription[];
  payments: DemoPayment[];
  checkIns: DemoCheckIn[];
  reminders: DemoReminder[];
};

const DB_KEY = "gymflow_demo_db_v2";

const adminUser = {
  _id: "user-demo-admin",
  name: "Marcus Mdluli",
  email: "marcus@gymflow.com",
  role: "admin",
};

function nowIso() {
  return new Date().toISOString();
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanRef(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dateCode(value: Date | string = new Date()) {
  const date = new Date(value);

  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}${String(date.getDate()).padStart(2, "0")}`;
}

function generateReceiptNumber(db: DemoDb) {
  return `PAY-${dateCode()}-${String(db.payments.length + 1).padStart(4, "0")}`;
}

function generatePaymentReference(member: DemoMember) {
  return `PAY-${cleanRef(member.firstName)}-${cleanRef(member.lastName)}-${cleanRef(
    member.memberCode,
  )}-${dateCode()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function seedDb(): DemoDb {
  const createdAt = "2026-05-31T08:00:00.000Z";

  const makeMember = (
    number: number,
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    status: DemoMember["status"],
    joinedOffset: number,
    notes?: string,
  ): DemoMember => {
    return {
      _id: `mem-${String(number).padStart(3, "0")}`,
      memberCode: `GYM-${String(number).padStart(4, "0")}`,
      firstName,
      lastName,
      phone,
      email,
      status,
      joinedAt: daysFromNow(joinedOffset),
      createdAt,
      updatedAt: createdAt,
      emergencyContact: {
        name: `${firstName} Emergency`,
        phone: `07${String(10000000 + number * 77777).slice(0, 8)}`,
      },
      notes,
    };
  };

  const members: DemoMember[] = [
    makeMember(
      1,
      "Amukelani",
      "Mdluli",
      "0711111111",
      "amukelani@example.com",
      "active",
      -120,
      "Reliable monthly member. Usually pays cash.",
    ),
    makeMember(
      2,
      "Anele",
      "Mokoena",
      "0799999999",
      "anele@example.com",
      "inactive",
      -110,
      "Inactive profile. Should not be allowed entry.",
    ),
    makeMember(
      3,
      "James",
      "Xiluvana",
      "0744444444",
      "james@example.com",
      "active",
      -95,
      "Active profile but unpaid subscription.",
    ),
    makeMember(
      4,
      "Thabo",
      "Nkosi",
      "0733456789",
      "thabo@example.com",
      "active",
      -80,
      "Partial payment case.",
    ),
    makeMember(
      5,
      "Lerato",
      "Dlamini",
      "0601234567",
      "lerato@example.com",
      "suspended",
      -75,
      "Suspended because of repeated unpaid access attempts.",
    ),
    makeMember(
      6,
      "Sipho",
      "Zulu",
      "0727654321",
      "sipho@example.com",
      "active",
      -65,
      "Weekly pass member. Expires soon.",
    ),
    makeMember(
      7,
      "Nomsa",
      "Khumalo",
      "0782223344",
      "nomsa@example.com",
      "active",
      -60,
      "Expired subscription example.",
    ),
    makeMember(
      8,
      "Katlego",
      "Mabena",
      "0813334455",
      "katlego@example.com",
      "active",
      -58,
      "Pending EFT payment example.",
    ),
    makeMember(
      9,
      "Buhle",
      "Ndlovu",
      "0824445566",
      "buhle@example.com",
      "active",
      -50,
      "Active member profile with no subscription.",
    ),
    makeMember(
      10,
      "Kabelo",
      "Maseko",
      "0835556677",
      "kabelo@example.com",
      "active",
      -48,
      "Cancelled subscription example.",
    ),
    makeMember(
      11,
      "Naledi",
      "Radebe",
      "0846667788",
      "naledi@example.com",
      "active",
      -45,
      "Refunded subscription example.",
    ),
    makeMember(
      12,
      "Musa",
      "Sithole",
      "0857778899",
      "musa@example.com",
      "active",
      -42,
      "Future scheduled subscription.",
    ),
    makeMember(
      13,
      "Zanele",
      "Mthembu",
      "0868889900",
      "zanele@example.com",
      "active",
      -39,
      "Paid member already checked in today.",
    ),
    makeMember(
      14,
      "Mpho",
      "Molefe",
      "0879990011",
      "mpho@example.com",
      "active",
      -36,
      "Daily pass user.",
    ),
    makeMember(
      15,
      "Palesa",
      "Mokoena",
      "0881234501",
      "palesa@example.com",
      "inactive",
      -34,
      "Inactive but has old payment history.",
    ),
    makeMember(
      16,
      "Sibusiso",
      "Dube",
      "0892345602",
      "sibusiso@example.com",
      "active",
      -31,
      "Bank transfer member.",
    ),
    makeMember(
      17,
      "Keletso",
      "Motaung",
      "0613456703",
      "keletso@example.com",
      "active",
      -29,
      "Partial student membership.",
    ),
    makeMember(
      18,
      "Dineo",
      "Masondo",
      "0624567804",
      "dineo@example.com",
      "active",
      -25,
      "Unpaid monthly member with reminder pending.",
    ),
    makeMember(
      19,
      "Bongani",
      "Ncube",
      "0635678905",
      "bongani@example.com",
      "suspended",
      -22,
      "Suspended even though a payment exists.",
    ),
    makeMember(
      20,
      "Nandi",
      "Buthelezi",
      "0646789006",
      "nandi@example.com",
      "active",
      -20,
      "Fully paid monthly member.",
    ),
    makeMember(
      21,
      "Tshepo",
      "Mokoena",
      "0657890107",
      "tshepo@example.com",
      "active",
      -18,
      "Card payment member.",
    ),
    makeMember(
      22,
      "Karabo",
      "Mahlangu",
      "0668901208",
      "karabo@example.com",
      "active",
      -16,
      "Expiring tomorrow.",
    ),
    makeMember(
      23,
      "Ayanda",
      "Cele",
      "0679012309",
      "ayanda@example.com",
      "active",
      -14,
      "EFT failed payment case.",
    ),
    makeMember(
      24,
      "Neo",
      "Matlala",
      "0680123410",
      "neo@example.com",
      "active",
      -10,
      "New member, trial/daily access.",
    ),
  ];

  const plans: DemoPlan[] = [
    {
      _id: "plan-daily",
      name: "Daily Pass",
      type: "daily",
      price: 50,
      durationInDays: 1,
      description: "Single day gym access.",
      benefits: ["One day access", "Reception check-in"],
      isActive: true,
      displayOrder: 1,
      createdAt,
      updatedAt: createdAt,
    },
    {
      _id: "plan-weekly",
      name: "Weekly Pass",
      type: "weekly",
      price: 180,
      durationInDays: 7,
      description: "Weekly access for casual members.",
      benefits: ["7 days access", "Payment reminders"],
      isActive: true,
      displayOrder: 2,
      createdAt,
      updatedAt: createdAt,
    },
    {
      _id: "plan-monthly",
      name: "Monthly Membership",
      type: "monthly",
      price: 350,
      durationInDays: 30,
      description: "Standard monthly gym membership.",
      benefits: ["Full gym access", "Renewal reminders", "Check-in control"],
      isActive: true,
      displayOrder: 3,
      createdAt,
      updatedAt: createdAt,
    },
    {
      _id: "plan-student",
      name: "Student Monthly",
      type: "monthly",
      price: 250,
      durationInDays: 30,
      description: "Discounted student membership.",
      benefits: ["Student discount", "Full gym access"],
      isActive: true,
      displayOrder: 4,
      createdAt,
      updatedAt: createdAt,
    },
    {
      _id: "plan-premium",
      name: "Premium Monthly",
      type: "monthly",
      price: 499,
      durationInDays: 30,
      description: "Premium access with priority support.",
      benefits: ["Full gym access", "Priority support", "Progress tracking"],
      isActive: true,
      displayOrder: 5,
      createdAt,
      updatedAt: createdAt,
    },
    {
      _id: "plan-legacy",
      name: "Legacy Plan",
      type: "custom",
      price: 299,
      durationInDays: 30,
      description: "Old inactive plan kept for historic records.",
      benefits: ["Historic package"],
      isActive: false,
      displayOrder: 6,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  const planById = Object.fromEntries(plans.map((plan) => [plan._id, plan]));

  const makeSubscription = (
    number: number,
    memberId: string,
    planId: string,
    startOffset: number,
    status: DemoSubscription["status"],
    paymentStatus: DemoSubscription["paymentStatus"],
    gracePeriodDays = 0,
    notes?: string,
  ): DemoSubscription => {
    const plan = planById[planId];
    const startsAt = new Date(daysFromNow(startOffset));
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + plan.durationInDays);

    return {
      _id: `sub-${String(number).padStart(3, "0")}`,
      member: memberId,
      plan: planId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status,
      paymentStatus,
      gracePeriodDays,
      notes,
      planSnapshot: {
        name: plan.name,
        type: plan.type,
        price: plan.price,
        durationInDays: plan.durationInDays,
      },
      createdAt,
      updatedAt: createdAt,
    };
  };

  const subscriptions: DemoSubscription[] = [
    makeSubscription(1, "mem-001", "plan-monthly", -2, "active", "paid"),
    makeSubscription(2, "mem-002", "plan-monthly", 1, "scheduled", "unpaid"),
    makeSubscription(3, "mem-003", "plan-monthly", -6, "active", "unpaid"),
    makeSubscription(4, "mem-004", "plan-student", -20, "active", "partial", 2),
    makeSubscription(5, "mem-005", "plan-monthly", -40, "suspended", "unpaid"),
    makeSubscription(6, "mem-006", "plan-weekly", -4, "active", "paid"),
    makeSubscription(7, "mem-007", "plan-monthly", -45, "expired", "paid"),
    makeSubscription(
      8,
      "mem-008",
      "plan-monthly",
      -3,
      "active",
      "unpaid",
      0,
      "EFT pending.",
    ),
    makeSubscription(9, "mem-010", "plan-monthly", -18, "cancelled", "paid"),
    makeSubscription(10, "mem-011", "plan-monthly", -10, "active", "refunded"),
    makeSubscription(11, "mem-012", "plan-premium", 5, "scheduled", "paid"),
    makeSubscription(12, "mem-013", "plan-monthly", -8, "active", "paid"),
    makeSubscription(13, "mem-014", "plan-daily", 0, "active", "paid"),
    makeSubscription(14, "mem-015", "plan-legacy", -60, "expired", "paid"),
    makeSubscription(15, "mem-016", "plan-premium", -12, "active", "paid"),
    makeSubscription(16, "mem-017", "plan-student", -7, "active", "partial", 3),
    makeSubscription(17, "mem-018", "plan-monthly", -15, "active", "unpaid"),
    makeSubscription(18, "mem-019", "plan-monthly", -9, "suspended", "paid"),
    makeSubscription(19, "mem-020", "plan-monthly", -4, "active", "paid"),
    makeSubscription(20, "mem-021", "plan-premium", -2, "active", "paid"),
    makeSubscription(21, "mem-022", "plan-weekly", -6, "active", "paid"),
    makeSubscription(22, "mem-023", "plan-monthly", -1, "active", "unpaid"),
    makeSubscription(23, "mem-024", "plan-daily", 0, "active", "paid"),
  ];

  const memberById = Object.fromEntries(
    members.map((member) => [member._id, member]),
  );

  const refFor = (memberId: string, offset: number, suffix: string) => {
    const member = memberById[memberId];

    return `PAY-${cleanRef(member.firstName)}-${cleanRef(
      member.lastName,
    )}-${cleanRef(member.memberCode)}-${dateCode(daysFromNow(offset))}-${suffix}`;
  };

  const makePayment = (
    number: number,
    memberId: string,
    subscriptionId: string,
    amount: number,
    method: DemoPayment["method"],
    status: DemoPayment["status"],
    offset: number,
    notes?: string,
  ): DemoPayment => {
    const paidAt =
      status === "paid" || status === "refunded" ? daysFromNow(offset) : null;

    return {
      _id: `pay-${String(number).padStart(3, "0")}`,
      receiptNumber: `PAY-${dateCode(daysFromNow(offset))}-${String(
        number,
      ).padStart(4, "0")}`,
      reference: refFor(memberId, offset, `D${number}MO`),
      member: memberId,
      subscription: subscriptionId,
      amount,
      method,
      status,
      paidAt,
      notes,
      createdAt: daysFromNow(offset),
      updatedAt: daysFromNow(offset),
      receivedBy: adminUser,
    };
  };

  const payments: DemoPayment[] = [
    makePayment(
      1,
      "mem-001",
      "sub-001",
      350,
      "cash",
      "paid",
      0,
      "Cash received at reception.",
    ),
    makePayment(
      2,
      "mem-006",
      "sub-006",
      180,
      "eft",
      "paid",
      -1,
      "EFT confirmed.",
    ),
    makePayment(
      3,
      "mem-004",
      "sub-004",
      100,
      "cash",
      "paid",
      -2,
      "Partial payment.",
    ),
    makePayment(
      4,
      "mem-007",
      "sub-007",
      350,
      "card",
      "paid",
      -38,
      "Paid but subscription is now expired.",
    ),
    makePayment(
      5,
      "mem-008",
      "sub-008",
      350,
      "eft",
      "pending",
      0,
      "EFT proof received, waiting for confirmation.",
    ),
    makePayment(
      6,
      "mem-010",
      "sub-009",
      350,
      "cash",
      "paid",
      -12,
      "Subscription later cancelled.",
    ),
    makePayment(
      7,
      "mem-011",
      "sub-010",
      350,
      "card",
      "refunded",
      -8,
      "Refunded after cancellation request.",
    ),
    makePayment(
      8,
      "mem-012",
      "sub-011",
      499,
      "bank_transfer",
      "paid",
      -1,
      "Paid before future start date.",
    ),
    makePayment(
      9,
      "mem-013",
      "sub-012",
      350,
      "cash",
      "paid",
      0,
      "Already checked in today.",
    ),
    makePayment(
      10,
      "mem-014",
      "sub-013",
      50,
      "cash",
      "paid",
      0,
      "Daily pass payment.",
    ),
    makePayment(
      11,
      "mem-015",
      "sub-014",
      299,
      "cash",
      "paid",
      -50,
      "Old inactive member payment.",
    ),
    makePayment(
      12,
      "mem-016",
      "sub-015",
      499,
      "bank_transfer",
      "paid",
      -3,
      "Premium monthly paid.",
    ),
    makePayment(
      13,
      "mem-017",
      "sub-016",
      120,
      "cash",
      "paid",
      -2,
      "Student partial payment.",
    ),
    makePayment(
      14,
      "mem-019",
      "sub-018",
      350,
      "card",
      "paid",
      -6,
      "Paid but member is suspended.",
    ),
    makePayment(
      15,
      "mem-020",
      "sub-019",
      350,
      "eft",
      "paid",
      -1,
      "Monthly EFT confirmed.",
    ),
    makePayment(
      16,
      "mem-021",
      "sub-020",
      499,
      "card",
      "paid",
      0,
      "Premium member card payment.",
    ),
    makePayment(
      17,
      "mem-022",
      "sub-021",
      180,
      "cash",
      "paid",
      -5,
      "Weekly pass, expiring tomorrow.",
    ),
    makePayment(
      18,
      "mem-023",
      "sub-022",
      350,
      "eft",
      "failed",
      -1,
      "EFT failed.",
    ),
    makePayment(
      19,
      "mem-024",
      "sub-023",
      50,
      "cash",
      "paid",
      0,
      "New daily access.",
    ),
  ];

  const makeCheckIn = (
    number: number,
    memberId: string,
    subscriptionId: string | undefined,
    offset: number,
    entryStatus: DemoCheckIn["entryStatus"],
    decisionCode: string,
    message: string,
  ): DemoCheckIn => {
    return {
      _id: `cin-${String(number).padStart(3, "0")}`,
      member: memberId,
      subscription: subscriptionId,
      checkedInAt: daysFromNow(offset),
      entryStatus,
      decisionCode,
      message,
      createdAt: daysFromNow(offset),
    };
  };

  const checkIns: DemoCheckIn[] = [
    makeCheckIn(
      1,
      "mem-001",
      "sub-001",
      0,
      "allowed",
      "paid_active",
      "Entry allowed. Member is active and paid.",
    ),
    makeCheckIn(
      2,
      "mem-003",
      "sub-003",
      0,
      "blocked",
      "payment_unpaid",
      "Entry blocked. Membership payment is unpaid.",
    ),
    makeCheckIn(
      3,
      "mem-004",
      "sub-004",
      -1,
      "warning",
      "partial_payment",
      "Entry warning. Member has a partial payment.",
    ),
    makeCheckIn(
      4,
      "mem-005",
      "sub-005",
      0,
      "blocked",
      "member_suspended",
      "Entry blocked. Member is suspended.",
    ),
    makeCheckIn(
      5,
      "mem-007",
      "sub-007",
      -2,
      "blocked",
      "subscription_expired",
      "Entry blocked. Subscription has expired.",
    ),
    makeCheckIn(
      6,
      "mem-009",
      undefined,
      0,
      "blocked",
      "no_subscription",
      "Entry blocked. No subscription found.",
    ),
    makeCheckIn(
      7,
      "mem-012",
      "sub-011",
      0,
      "blocked",
      "subscription_scheduled",
      "Entry blocked. Subscription starts in the future.",
    ),
    makeCheckIn(
      8,
      "mem-013",
      "sub-012",
      0,
      "allowed",
      "paid_active",
      "Entry allowed. Member is active and paid.",
    ),
    makeCheckIn(
      9,
      "mem-013",
      "sub-012",
      0,
      "warning",
      "already_checked_in_today",
      "Entry warning. Member already checked in today.",
    ),
    makeCheckIn(
      10,
      "mem-015",
      "sub-014",
      -3,
      "blocked",
      "member_inactive",
      "Entry blocked. Member is inactive.",
    ),
    makeCheckIn(
      11,
      "mem-016",
      "sub-015",
      -1,
      "allowed",
      "paid_active",
      "Entry allowed. Member is active and paid.",
    ),
    makeCheckIn(
      12,
      "mem-017",
      "sub-016",
      0,
      "warning",
      "partial_payment",
      "Entry warning. Member has a partial payment.",
    ),
    makeCheckIn(
      13,
      "mem-018",
      "sub-017",
      0,
      "blocked",
      "payment_unpaid",
      "Entry blocked. Membership payment is unpaid.",
    ),
    makeCheckIn(
      14,
      "mem-019",
      "sub-018",
      -1,
      "blocked",
      "member_suspended",
      "Entry blocked. Member is suspended.",
    ),
    makeCheckIn(
      15,
      "mem-020",
      "sub-019",
      0,
      "allowed",
      "paid_active",
      "Entry allowed. Member is active and paid.",
    ),
    makeCheckIn(
      16,
      "mem-021",
      "sub-020",
      0,
      "allowed",
      "paid_active",
      "Entry allowed. Member is active and paid.",
    ),
    makeCheckIn(
      17,
      "mem-022",
      "sub-021",
      0,
      "allowed",
      "paid_active",
      "Entry allowed. Member is active and paid.",
    ),
    makeCheckIn(
      18,
      "mem-023",
      "sub-022",
      0,
      "blocked",
      "payment_unpaid",
      "Entry blocked. Payment has not been confirmed.",
    ),
    makeCheckIn(
      19,
      "mem-024",
      "sub-023",
      0,
      "allowed",
      "paid_active",
      "Entry allowed. Daily pass is paid.",
    ),
  ];

  const makeReminder = (
    number: number,
    memberId: string,
    subscriptionId: string,
    type: DemoReminder["type"],
    status: DemoReminder["status"],
    offset: number,
    message: string,
    failureReason?: string,
  ): DemoReminder => {
    const member = memberById[memberId];

    return {
      _id: `rem-${String(number).padStart(3, "0")}`,
      type,
      channel: "manual_whatsapp",
      status,
      scheduledFor: daysFromNow(offset),
      message,
      phone: member.phone,
      whatsappUrl: `https://wa.me/27${member.phone.slice(
        1,
      )}?text=${encodeURIComponent(message)}`,
      sentAt: status === "sent" ? daysFromNow(offset) : null,
      failedAt: status === "failed" ? daysFromNow(offset) : null,
      failureReason,
      cancelledAt: status === "cancelled" ? daysFromNow(offset) : null,
      member: memberId,
      subscription: subscriptionId,
      createdAt: daysFromNow(offset),
      updatedAt: daysFromNow(offset),
    };
  };

  const reminders: DemoReminder[] = [
    makeReminder(
      1,
      "mem-003",
      "sub-003",
      "payment_due",
      "pending",
      0,
      "Hi James, your GymFlow membership payment is still due. Please make payment to keep your access active.",
    ),
    makeReminder(
      2,
      "mem-004",
      "sub-004",
      "partial_payment",
      "pending",
      0,
      "Hi Thabo, this is a reminder that your GymFlow subscription has a partial payment balance.",
    ),
    makeReminder(
      3,
      "mem-006",
      "sub-006",
      "expiry_3_days",
      "sent",
      -1,
      "Hi Sipho, your weekly pass expires soon. Renew early to avoid interruption.",
    ),
    makeReminder(
      4,
      "mem-007",
      "sub-007",
      "expired",
      "pending",
      0,
      "Hi Nomsa, your membership has expired. Please renew to continue training.",
    ),
    makeReminder(
      5,
      "mem-008",
      "sub-008",
      "payment_due",
      "pending",
      0,
      "Hi Katlego, your EFT payment is still pending confirmation.",
    ),
    makeReminder(
      6,
      "mem-017",
      "sub-016",
      "partial_payment",
      "sent",
      -2,
      "Hi Keletso, please settle your remaining student membership balance.",
    ),
    makeReminder(
      7,
      "mem-018",
      "sub-017",
      "payment_due",
      "failed",
      -1,
      "Hi Dineo, your monthly membership payment is due.",
      "Phone number did not connect.",
    ),
    makeReminder(
      8,
      "mem-022",
      "sub-021",
      "expiry_1_day",
      "pending",
      0,
      "Hi Karabo, your weekly pass expires tomorrow. Renew now to avoid interruption.",
    ),
    makeReminder(
      9,
      "mem-023",
      "sub-022",
      "payment_due",
      "pending",
      0,
      "Hi Ayanda, your EFT payment failed. Please retry payment.",
    ),
    makeReminder(
      10,
      "mem-010",
      "sub-009",
      "expired",
      "cancelled",
      -4,
      "Hi Kabelo, your cancelled subscription reminder is no longer needed.",
    ),
  ];

  return {
    members,
    plans,
    subscriptions,
    payments,
    checkIns,
    reminders,
  };
}

function getDb(): DemoDb {
  if (typeof window === "undefined") return seedDb();

  const raw = window.localStorage.getItem(DB_KEY);

  if (!raw) {
    const seeded = seedDb();
    window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw) as DemoDb;
  } catch {
    const seeded = seedDb();
    window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDb(db: DemoDb) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function success<T>(
  message: string,
  data?: T,
  meta?: MockResponse<T>["meta"],
): MockResponse<T> {
  return {
    success: true,
    message,
    data,
    meta,
  };
}

function fail(message: string): never {
  throw new Error(message);
}

function delay() {
  return new Promise((resolve) => window.setTimeout(resolve, 180));
}

function getUrl(endpoint: string) {
  return new URL(endpoint, "http://gymflow.local");
}

function paginate<T>(items: T[], page = 1, limit = 100) {
  const total = items.length;
  const start = (page - 1) * limit;
  const paginated = items.slice(start, start + limit);

  return {
    paginated,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

function attachSubscriptionRelations(
  db: DemoDb,
  subscription: DemoSubscription,
) {
  const member = db.members.find((item) => item._id === subscription.member);
  const plan = db.plans.find((item) => item._id === subscription.plan);

  return {
    ...subscription,
    member,
    plan,
  };
}

function attachPaymentRelations(db: DemoDb, payment: DemoPayment) {
  const member = db.members.find((item) => item._id === payment.member);
  const subscription = db.subscriptions.find(
    (item) => item._id === payment.subscription,
  );

  return {
    ...payment,
    member,
    subscription: subscription
      ? attachSubscriptionRelations(db, subscription)
      : undefined,
  };
}

function attachReminderRelations(db: DemoDb, reminder: DemoReminder) {
  const member = db.members.find((item) => item._id === reminder.member);
  const subscription = db.subscriptions.find(
    (item) => item._id === reminder.subscription,
  );

  return {
    ...reminder,
    member,
    subscription: subscription
      ? attachSubscriptionRelations(db, subscription)
      : undefined,
    memberSnapshot: member
      ? {
          memberCode: member.memberCode,
          firstName: member.firstName,
          lastName: member.lastName,
          phone: member.phone,
          status: member.status,
        }
      : undefined,
    subscriptionSnapshot: subscription
      ? {
          status: subscription.status,
          paymentStatus: subscription.paymentStatus,
          planName: subscription.planSnapshot.name,
          planPrice: subscription.planSnapshot.price,
          startsAt: subscription.startsAt,
          endsAt: subscription.endsAt,
          gracePeriodDays: subscription.gracePeriodDays,
        }
      : undefined,
  };
}

function getSubscriptionPaidTotal(db: DemoDb, subscriptionId: string) {
  return db.payments
    .filter(
      (payment) =>
        payment.subscription === subscriptionId && payment.status === "paid",
    )
    .reduce((total, payment) => total + payment.amount, 0);
}

function syncSubscriptionPaymentStatus(db: DemoDb, subscriptionId: string) {
  const subscription = db.subscriptions.find(
    (item) => item._id === subscriptionId,
  );
  if (!subscription) return;

  const paidTotal = getSubscriptionPaidTotal(db, subscriptionId);
  const price = subscription.planSnapshot.price;

  if (paidTotal <= 0) subscription.paymentStatus = "unpaid";
  else if (paidTotal < price) subscription.paymentStatus = "partial";
  else subscription.paymentStatus = "paid";

  subscription.updatedAt = nowIso();
}

function getCurrentSubscription(db: DemoDb, memberId: string) {
  return (
    db.subscriptions.find(
      (item) => item.member === memberId && item.status === "active",
    ) ||
    db.subscriptions.find(
      (item) => item.member === memberId && item.status === "scheduled",
    ) ||
    db.subscriptions.find((item) => item.member === memberId)
  );
}

function getCheckInDecision(db: DemoDb, memberId: string) {
  const member = db.members.find((item) => item._id === memberId);

  if (!member) {
    return {
      entryStatus: "blocked",
      decisionCode: "member_not_found",
      message: "Entry blocked. Member not found.",
      alreadyCheckedInToday: false,
    };
  }

  const subscription = getCurrentSubscription(db, memberId);

  if (member.status === "suspended") {
    return {
      entryStatus: "blocked",
      decisionCode: "member_suspended",
      message: "Entry blocked. Member is suspended.",
      alreadyCheckedInToday: false,
    };
  }

  if (member.status === "inactive") {
    return {
      entryStatus: "blocked",
      decisionCode: "member_inactive",
      message: "Entry blocked. Member is inactive.",
      alreadyCheckedInToday: false,
    };
  }

  if (!subscription) {
    return {
      entryStatus: "blocked",
      decisionCode: "no_subscription",
      message: "Entry blocked. No subscription found.",
      alreadyCheckedInToday: false,
    };
  }

  if (subscription.status === "expired") {
    return {
      entryStatus: "blocked",
      decisionCode: "subscription_expired",
      message: "Entry blocked. Subscription has expired.",
      alreadyCheckedInToday: false,
    };
  }

  if (subscription.paymentStatus === "unpaid") {
    return {
      entryStatus: "blocked",
      decisionCode: "payment_unpaid",
      message: "Entry blocked. Membership payment is unpaid.",
      alreadyCheckedInToday: false,
    };
  }

  if (subscription.paymentStatus === "partial") {
    return {
      entryStatus: "warning",
      decisionCode: "partial_payment",
      message: "Entry warning. Member has a partial payment.",
      alreadyCheckedInToday: false,
    };
  }

  return {
    entryStatus: "allowed",
    decisionCode: "paid_active",
    message: "Entry allowed. Member is active and paid.",
    alreadyCheckedInToday: false,
  };
}

function revenueInRange(db: DemoDb, startDate: Date, endDate: Date) {
  const payments = db.payments.filter((payment) => {
    if (payment.status !== "paid") return false;
    const date = new Date(payment.paidAt || payment.createdAt);
    return date >= startDate && date <= endDate;
  });

  return {
    totalRevenue: payments.reduce(
      (total, payment) => total + payment.amount,
      0,
    ),
    totalPayments: payments.length,
    payments,
  };
}

function getRange(
  period: string | null,
  fromDate?: string | null,
  toDate?: string | null,
) {
  const now = new Date();

  if (fromDate || toDate) {
    return {
      label: "custom",
      startDate: fromDate
        ? new Date(fromDate)
        : new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: toDate ? new Date(toDate) : now,
    };
  }

  if (period === "today") {
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );
    return { label: "today", startDate, endDate };
  }

  if (period === "week") {
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    return { label: "week", startDate, endDate: now };
  }

  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = now;
  return { label: "month", startDate, endDate };
}

export async function mockApiRequest<T>(
  endpoint: string,
  options: MockOptions = {},
): Promise<MockResponse<T>> {
  await delay();

  const db = getDb();
  const url = getUrl(endpoint);
  const path = url.pathname;
  const method = (options.method || "GET").toUpperCase();
  const body = (options.body || {}) as Record<string, unknown>;

  if (path === "/auth/login" && method === "POST") {
    return success("Login successful", {
      token: "gymflow_demo_token",
      user: adminUser,
    } as T);
  }

  if (path === "/members" && method === "GET") {
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search") || "";
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 100);

    const filtered = db.members.filter((member) => {
      const text = [
        member.memberCode,
        member.firstName,
        member.lastName,
        member.phone,
        member.email,
        member.status,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!status || member.status === status) &&
        text.includes(search.toLowerCase())
      );
    });

    const { paginated, meta } = paginate(filtered, page, limit);
    return success(
      "Members fetched successfully",
      { members: paginated } as T,
      meta,
    );
  }

  if (path === "/members" && method === "POST") {
    const nextNumber = db.members.length + 1;

    const member: DemoMember = {
      _id: id("mem"),
      memberCode: `GYM-${String(nextNumber).padStart(4, "0")}`,
      firstName: String(body.firstName || ""),
      lastName: String(body.lastName || ""),
      phone: String(body.phone || ""),
      email: String(body.email || ""),
      status: "active",
      joinedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      notes: body.notes ? String(body.notes) : undefined,
    };

    db.members.unshift(member);
    saveDb(db);

    return success("Member created successfully", { member } as T);
  }

  if (path.startsWith("/members/")) {
    const [, , memberId, action] = path.split("/");
    const member = db.members.find((item) => item._id === memberId);

    if (!member) fail("Member not found.");

    if (!action && method === "GET") {
      return success("Member fetched successfully", { member } as T);
    }

    if (method === "PATCH") {
      if (action === "suspend") member.status = "suspended";
      if (action === "deactivate") member.status = "inactive";
      if (action === "reactivate") member.status = "active";

      member.updatedAt = nowIso();
      saveDb(db);

      return success("Member status updated successfully", { member } as T);
    }
  }

  if (path === "/membership-plans/active") {
    const plans = db.plans.filter((plan) => plan.isActive);
    return success("Active plans fetched successfully", { plans } as T);
  }

  if (path === "/membership-plans" && method === "GET") {
    return success("Plans fetched successfully", { plans: db.plans } as T);
  }

  if (path === "/membership-plans" && method === "POST") {
    const plan: DemoPlan = {
      _id: id("plan"),
      name: String(body.name || "New Plan"),
      type: (body.type || "monthly") as DemoPlan["type"],
      price: Number(body.price || 0),
      durationInDays: Number(body.durationInDays || 30),
      description: body.description ? String(body.description) : undefined,
      benefits: Array.isArray(body.benefits) ? (body.benefits as string[]) : [],
      isActive: true,
      displayOrder: Number(body.displayOrder || db.plans.length + 1),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    db.plans.push(plan);
    saveDb(db);

    return success("Membership plan created successfully", { plan } as T);
  }

  if (path.startsWith("/membership-plans/") && method === "PATCH") {
    const [, , planId, action] = path.split("/");
    const plan = db.plans.find((item) => item._id === planId);
    if (!plan) fail("Membership plan not found.");

    if (action === "deactivate") plan.isActive = false;
    if (action === "reactivate") plan.isActive = true;

    plan.updatedAt = nowIso();
    saveDb(db);

    return success("Membership plan updated successfully", { plan } as T);
  }

  if (path === "/subscriptions" && method === "GET") {
    const memberId = url.searchParams.get("memberId");
    const status = url.searchParams.get("status");
    const paymentStatus = url.searchParams.get("paymentStatus");

    let subscriptions = db.subscriptions;

    if (memberId) {
      subscriptions = subscriptions.filter((item) => item.member === memberId);
    }

    if (status) {
      subscriptions = subscriptions.filter((item) => item.status === status);
    }

    if (paymentStatus) {
      subscriptions = subscriptions.filter(
        (item) => item.paymentStatus === paymentStatus,
      );
    }

    return success("Subscriptions fetched successfully", {
      subscriptions: subscriptions.map((item) =>
        attachSubscriptionRelations(db, item),
      ),
    } as T);
  }

  if (path === "/subscriptions" && method === "POST") {
    const memberId = String(body.memberId);
    const planId = String(body.planId);

    const member = db.members.find((item) => item._id === memberId);
    const plan = db.plans.find((item) => item._id === planId);

    if (!member) fail("Member not found.");
    if (!plan) fail("Plan not found.");

    const startsAt = body.startsAt
      ? new Date(String(body.startsAt))
      : new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + plan.durationInDays);

    const subscription: DemoSubscription = {
      _id: id("sub"),
      member: member._id,
      plan: plan._id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: startsAt > new Date() ? "scheduled" : "active",
      paymentStatus: (body.paymentStatus ||
        "unpaid") as DemoSubscription["paymentStatus"],
      gracePeriodDays: Number(body.gracePeriodDays || 0),
      notes: body.notes ? String(body.notes) : undefined,
      planSnapshot: {
        name: plan.name,
        type: plan.type,
        price: plan.price,
        durationInDays: plan.durationInDays,
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    db.subscriptions.unshift(subscription);
    saveDb(db);

    return success("Subscription created successfully", {
      subscription: attachSubscriptionRelations(db, subscription),
    } as T);
  }

  if (path.startsWith("/subscriptions/") && method === "PATCH") {
    const [, , subscriptionId, action] = path.split("/");
    const subscription = db.subscriptions.find(
      (item) => item._id === subscriptionId,
    );
    if (!subscription) fail("Subscription not found.");

    if (action === "cancel") subscription.status = "cancelled";
    if (action === "suspend") subscription.status = "suspended";
    if (action === "reactivate") subscription.status = "active";

    if (action === "renew") {
      const startsAt = new Date();
      const endsAt = new Date(startsAt);
      endsAt.setDate(
        endsAt.getDate() + subscription.planSnapshot.durationInDays,
      );

      subscription.startsAt = startsAt.toISOString();
      subscription.endsAt = endsAt.toISOString();
      subscription.status = "active";
      subscription.paymentStatus = "unpaid";
    }

    subscription.updatedAt = nowIso();
    saveDb(db);

    return success("Subscription updated successfully", {
      subscription: attachSubscriptionRelations(db, subscription),
    } as T);
  }

  if (path === "/payments/summary") {
    const today = getRange("today");
    const week = getRange("week");
    const month = getRange("month");

    const todayRevenue = revenueInRange(db, today.startDate, today.endDate);
    const weekRevenue = revenueInRange(db, week.startDate, week.endDate);
    const monthRevenue = revenueInRange(db, month.startDate, month.endDate);

    const byMethod = ["cash", "card", "eft", "bank_transfer", "other"]
      .map((methodName) => {
        const payments = monthRevenue.payments.filter(
          (payment) => payment.method === methodName,
        );

        return {
          method: methodName,
          totalRevenue: payments.reduce(
            (total, payment) => total + payment.amount,
            0,
          ),
          totalPayments: payments.length,
        };
      })
      .filter((item) => item.totalPayments > 0);

    return success("Payment summary fetched successfully", {
      today: {
        totalRevenue: todayRevenue.totalRevenue,
        totalPayments: todayRevenue.totalPayments,
        startDate: today.startDate,
        endDate: today.endDate,
      },
      week: {
        totalRevenue: weekRevenue.totalRevenue,
        totalPayments: weekRevenue.totalPayments,
        startDate: week.startDate,
        endDate: week.endDate,
      },
      month: {
        totalRevenue: monthRevenue.totalRevenue,
        totalPayments: monthRevenue.totalPayments,
        startDate: month.startDate,
        endDate: month.endDate,
        byMethod,
      },
    } as T);
  }

  if (path === "/payments" && method === "GET") {
    const memberId = url.searchParams.get("memberId");
    const subscriptionId = url.searchParams.get("subscriptionId");

    let payments = db.payments;

    if (memberId)
      payments = payments.filter((item) => item.member === memberId);
    if (subscriptionId) {
      payments = payments.filter(
        (item) => item.subscription === subscriptionId,
      );
    }

    return success("Payments fetched successfully", {
      payments: payments.map((item) => attachPaymentRelations(db, item)),
    } as T);
  }

  if (path === "/payments" && method === "POST") {
    const subscriptionId = String(body.subscriptionId);
    const subscription = db.subscriptions.find(
      (item) => item._id === subscriptionId,
    );

    if (!subscription) fail("Subscription not found.");

    const member = db.members.find((item) => item._id === subscription.member);
    if (!member) fail("Member not found.");

    const payment: DemoPayment = {
      _id: id("pay"),
      receiptNumber: generateReceiptNumber(db),
      reference: generatePaymentReference(member),
      member: member._id,
      subscription: subscription._id,
      amount: Number(body.amount || 0),
      method: (body.method || "cash") as DemoPayment["method"],
      status: (body.status || "paid") as DemoPayment["status"],
      paidAt: body.status === "pending" ? null : nowIso(),
      notes: body.notes ? String(body.notes) : undefined,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      receivedBy: adminUser,
    };

    db.payments.unshift(payment);
    syncSubscriptionPaymentStatus(db, subscription._id);
    saveDb(db);

    return success("Payment recorded successfully", {
      payment: attachPaymentRelations(db, payment),
      subscriptionPaymentSummary: {
        totalPaid: getSubscriptionPaidTotal(db, subscription._id),
        subscriptionPrice: subscription.planSnapshot.price,
        balanceDue: Math.max(
          subscription.planSnapshot.price -
            getSubscriptionPaidTotal(db, subscription._id),
          0,
        ),
        paymentStatus: subscription.paymentStatus,
      },
    } as T);
  }

  if (path.startsWith("/payments/member/")) {
    const memberId = path.split("/")[3];
    const member = db.members.find((item) => item._id === memberId);
    if (!member) fail("Member not found.");

    const payments = db.payments
      .filter((item) => item.member === memberId)
      .map((item) => attachPaymentRelations(db, item));

    return success("Member payments fetched successfully", {
      member,
      payments,
    } as T);
  }

  if (path === "/check-ins" && method === "POST") {
    const memberId = String(body.memberId);
    const member = db.members.find((item) => item._id === memberId);
    if (!member) fail("Member not found.");

    const subscription = getCurrentSubscription(db, memberId);
    const decision = getCheckInDecision(db, memberId);

    const checkIn: DemoCheckIn = {
      _id: id("cin"),
      member: memberId,
      subscription: subscription?._id,
      checkedInAt: nowIso(),
      entryStatus: decision.entryStatus as DemoCheckIn["entryStatus"],
      decisionCode: decision.decisionCode,
      message: decision.message,
      notes: body.notes ? String(body.notes) : undefined,
      createdAt: nowIso(),
    };

    db.checkIns.unshift(checkIn);
    saveDb(db);

    return success("Check-in recorded successfully", {
      checkIn: {
        ...checkIn,
        member,
        subscription: subscription
          ? attachSubscriptionRelations(db, subscription)
          : undefined,
      },
      decision,
    } as T);
  }

  if (path.startsWith("/check-ins/member/")) {
    const memberId = path.split("/")[3];
    const member = db.members.find((item) => item._id === memberId);
    if (!member) fail("Member not found.");

    const checkIns = db.checkIns
      .filter((item) => item.member === memberId)
      .map((item) => ({
        ...item,
        member,
      }));

    return success("Member check-ins fetched successfully", {
      member,
      checkIns,
    } as T);
  }

  if (path === "/reminders/summary") {
    const totals = {
      pending: db.reminders.filter((item) => item.status === "pending").length,
      sent: db.reminders.filter((item) => item.status === "sent").length,
      failed: db.reminders.filter((item) => item.status === "failed").length,
      cancelled: db.reminders.filter((item) => item.status === "cancelled")
        .length,
    };

    return success("Reminder summary fetched successfully", {
      totals,
      byType: [],
      latestPending: db.reminders
        .filter((item) => item.status === "pending")
        .slice(0, 5)
        .map((item) => attachReminderRelations(db, item)),
    } as T);
  }

  if (path === "/reminders/generate" && method === "POST") {
    let createdCount = 0;
    let existingCount = 0;

    db.subscriptions.forEach((subscription) => {
      if (!["unpaid", "partial"].includes(subscription.paymentStatus)) return;

      const alreadyExists = db.reminders.some(
        (reminder) =>
          reminder.subscription === subscription._id &&
          reminder.status === "pending",
      );

      if (alreadyExists) {
        existingCount += 1;
        return;
      }

      const member = db.members.find(
        (item) => item._id === subscription.member,
      );
      if (!member) return;

      const type =
        subscription.paymentStatus === "partial"
          ? "partial_payment"
          : "payment_due";

      const message =
        type === "partial_payment"
          ? `Hi ${member.firstName}, this is a reminder that your GymFlow subscription has a partial payment balance.`
          : `Hi ${member.firstName}, your GymFlow membership payment is still due. Please make payment to keep your access active.`;

      db.reminders.unshift({
        _id: id("rem"),
        type,
        channel: "manual_whatsapp",
        status: "pending",
        scheduledFor: nowIso(),
        message,
        phone: member.phone,
        whatsappUrl: `https://wa.me/27${member.phone.slice(1)}?text=${encodeURIComponent(
          message,
        )}`,
        member: member._id,
        subscription: subscription._id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });

      createdCount += 1;
    });

    saveDb(db);

    return success("Reminders generated successfully", {
      createdCount,
      existingCount,
      skippedCount: 0,
      createdReminders: db.reminders.slice(0, createdCount),
      skipped: [],
    } as T);
  }

  if (path === "/reminders" && method === "GET") {
    return success("Reminders fetched successfully", {
      reminders: db.reminders.map((item) => attachReminderRelations(db, item)),
    } as T);
  }

  if (path.startsWith("/reminders/member/")) {
    const memberId = path.split("/")[3];
    const member = db.members.find((item) => item._id === memberId);
    if (!member) fail("Member not found.");

    const reminders = db.reminders
      .filter((item) => item.member === memberId)
      .map((item) => attachReminderRelations(db, item));

    return success("Member reminders fetched successfully", {
      member,
      reminders,
    } as T);
  }

  if (path.startsWith("/reminders/") && method === "PATCH") {
    const [, , reminderId, action] = path.split("/");
    const reminder = db.reminders.find((item) => item._id === reminderId);
    if (!reminder) fail("Reminder not found.");

    if (action === "sent") {
      reminder.status = "sent";
      reminder.sentAt = nowIso();
    }

    if (action === "failed") {
      reminder.status = "failed";
      reminder.failedAt = nowIso();
      reminder.failureReason = String(body.failureReason || "Manual failure.");
    }

    if (action === "cancel") {
      reminder.status = "cancelled";
      reminder.cancelledAt = nowIso();
    }

    reminder.updatedAt = nowIso();
    saveDb(db);

    return success("Reminder updated successfully", {
      reminder: attachReminderRelations(db, reminder),
    } as T);
  }

  if (path === "/reports/dashboard") {
    const today = getRange("today");
    const week = getRange("week");
    const month = getRange("month");

    const todayRevenue = revenueInRange(db, today.startDate, today.endDate);
    const weekRevenue = revenueInRange(db, week.startDate, week.endDate);
    const monthRevenue = revenueInRange(db, month.startDate, month.endDate);

    const checkInsToday = db.checkIns.filter(
      (item) => new Date(item.checkedInAt) >= today.startDate,
    );

    const recentPayments = db.payments
      .slice(0, 8)
      .map((payment) => attachPaymentRelations(db, payment));

    const recentCheckIns = db.checkIns.slice(0, 8).map((checkIn) => {
      const member = db.members.find((item) => item._id === checkIn.member);
      const subscription = db.subscriptions.find(
        (item) => item._id === checkIn.subscription,
      );

      return {
        ...checkIn,
        member,
        subscription: subscription
          ? attachSubscriptionRelations(db, subscription)
          : undefined,
      };
    });

    return success("Dashboard report fetched successfully", {
      revenue: {
        today: {
          totalRevenue: todayRevenue.totalRevenue,
          totalPayments: todayRevenue.totalPayments,
          startDate: today.startDate,
          endDate: today.endDate,
        },
        week: {
          totalRevenue: weekRevenue.totalRevenue,
          totalPayments: weekRevenue.totalPayments,
          startDate: week.startDate,
          endDate: week.endDate,
        },
        month: {
          totalRevenue: monthRevenue.totalRevenue,
          totalPayments: monthRevenue.totalPayments,
          startDate: month.startDate,
          endDate: month.endDate,
        },
        pending: {
          totalPendingAmount: db.payments
            .filter((item) => item.status === "pending")
            .reduce((total, item) => total + item.amount, 0),
          totalPendingPayments: db.payments.filter(
            (item) => item.status === "pending",
          ).length,
        },
      },

      members: {
        totalMembers: db.members.length,
        activeMembers: db.members.filter((item) => item.status === "active")
          .length,
        inactiveMembers: db.members.filter((item) => item.status === "inactive")
          .length,
        suspendedMembers: db.members.filter(
          (item) => item.status === "suspended",
        ).length,
        newMembersThisMonth: db.members.length,
      },

      subscriptions: {
        activeSubscriptions: db.subscriptions.filter(
          (item) => item.status === "active",
        ).length,
        scheduledSubscriptions: db.subscriptions.filter(
          (item) => item.status === "scheduled",
        ).length,
        expiredSubscriptions: db.subscriptions.filter(
          (item) => item.status === "expired",
        ).length,
        cancelledSubscriptions: db.subscriptions.filter(
          (item) => item.status === "cancelled",
        ).length,
        suspendedSubscriptions: db.subscriptions.filter(
          (item) => item.status === "suspended",
        ).length,
        unpaidSubscriptions: db.subscriptions.filter(
          (item) => item.paymentStatus === "unpaid",
        ).length,
        partialSubscriptions: db.subscriptions.filter(
          (item) => item.paymentStatus === "partial",
        ).length,
        paidSubscriptions: db.subscriptions.filter(
          (item) => item.paymentStatus === "paid",
        ).length,
        expiringSoonSubscriptions: db.subscriptions.filter(
          (item) => new Date(item.endsAt) <= new Date(daysFromNow(7)),
        ).length,
      },

      checkInsToday: {
        totalAttempts: checkInsToday.length,
        successfulEntries: checkInsToday.filter((item) =>
          ["allowed", "warning"].includes(item.entryStatus),
        ).length,
        uniqueSuccessfulMembers: new Set(
          checkInsToday
            .filter((item) => ["allowed", "warning"].includes(item.entryStatus))
            .map((item) => item.member),
        ).size,
        allowedCount: checkInsToday.filter(
          (item) => item.entryStatus === "allowed",
        ).length,
        warningCount: checkInsToday.filter(
          (item) => item.entryStatus === "warning",
        ).length,
        blockedCount: checkInsToday.filter(
          (item) => item.entryStatus === "blocked",
        ).length,
        byDecisionCode: [],
      },

      reminders: {
        pending: db.reminders.filter((item) => item.status === "pending")
          .length,
        sent: db.reminders.filter((item) => item.status === "sent").length,
        failed: db.reminders.filter((item) => item.status === "failed").length,
        cancelled: db.reminders.filter((item) => item.status === "cancelled")
          .length,
      },

      activity: {
        recentPayments,
        recentCheckIns,
      },
    } as T);
  }

  if (path === "/reports/revenue") {
    const range = getRange(
      url.searchParams.get("period"),
      url.searchParams.get("fromDate"),
      url.searchParams.get("toDate"),
    );

    const revenue = revenueInRange(db, range.startDate, range.endDate);

    const byMethod = ["cash", "card", "eft", "bank_transfer", "other"]
      .map((methodName) => {
        const payments = revenue.payments.filter(
          (payment) => payment.method === methodName,
        );

        return {
          method: methodName,
          totalRevenue: payments.reduce(
            (total, payment) => total + payment.amount,
            0,
          ),
          totalPayments: payments.length,
        };
      })
      .filter((item) => item.totalPayments > 0);

    return success("Revenue report fetched successfully", {
      range,
      revenue: {
        totalRevenue: revenue.totalRevenue,
        totalPayments: revenue.totalPayments,
      },
      byMethod,
    } as T);
  }

  if (path === "/reports/members") {
    return success("Member report fetched successfully", {
      members: {
        totalMembers: db.members.length,
        activeMembers: db.members.filter((item) => item.status === "active")
          .length,
        inactiveMembers: db.members.filter((item) => item.status === "inactive")
          .length,
        suspendedMembers: db.members.filter(
          (item) => item.status === "suspended",
        ).length,
        newMembersThisMonth: db.members.length,
      },
      monthRange: {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
      },
    } as T);
  }

  if (path === "/reports/subscriptions") {
    return success("Subscription report fetched successfully", {
      subscriptions: {
        activeSubscriptions: db.subscriptions.filter(
          (item) => item.status === "active",
        ).length,
        scheduledSubscriptions: db.subscriptions.filter(
          (item) => item.status === "scheduled",
        ).length,
        expiredSubscriptions: db.subscriptions.filter(
          (item) => item.status === "expired",
        ).length,
        cancelledSubscriptions: db.subscriptions.filter(
          (item) => item.status === "cancelled",
        ).length,
        suspendedSubscriptions: db.subscriptions.filter(
          (item) => item.status === "suspended",
        ).length,
        unpaidSubscriptions: db.subscriptions.filter(
          (item) => item.paymentStatus === "unpaid",
        ).length,
        partialSubscriptions: db.subscriptions.filter(
          (item) => item.paymentStatus === "partial",
        ).length,
        paidSubscriptions: db.subscriptions.filter(
          (item) => item.paymentStatus === "paid",
        ).length,
        expiringSoonSubscriptions: db.subscriptions.filter(
          (item) => new Date(item.endsAt) <= new Date(daysFromNow(7)),
        ).length,
      },
    } as T);
  }

  if (path === "/reports/attendance") {
    const range = getRange(
      url.searchParams.get("period"),
      url.searchParams.get("fromDate"),
      url.searchParams.get("toDate"),
    );

    const checkIns = db.checkIns.filter((item) => {
      const date = new Date(item.checkedInAt);
      return date >= range.startDate && date <= range.endDate;
    });

    const byDecisionCode = Object.entries(
      checkIns.reduce<Record<string, number>>((acc, item) => {
        acc[item.decisionCode] = (acc[item.decisionCode] || 0) + 1;
        return acc;
      }, {}),
    ).map(([decisionCode, count]) => ({ decisionCode, count }));

    return success("Attendance report fetched successfully", {
      range,
      attendance: {
        totalAttempts: checkIns.length,
        successfulEntries: checkIns.filter((item) =>
          ["allowed", "warning"].includes(item.entryStatus),
        ).length,
        uniqueSuccessfulMembers: new Set(
          checkIns
            .filter((item) => ["allowed", "warning"].includes(item.entryStatus))
            .map((item) => item.member),
        ).size,
        allowedCount: checkIns.filter((item) => item.entryStatus === "allowed")
          .length,
        warningCount: checkIns.filter((item) => item.entryStatus === "warning")
          .length,
        blockedCount: checkIns.filter((item) => item.entryStatus === "blocked")
          .length,
        byDecisionCode,
      },
    } as T);
  }

  return success("Demo endpoint fallback", {} as T);
}
