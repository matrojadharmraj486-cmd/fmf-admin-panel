import { Document, Font, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'

// Brand palette — mirrors the mobile app's TransactionInvoicePdfView.
const BRAND_PRIMARY = '#5DE0E6'
const BRAND_SECONDARY = '#004AAD'
const WHITE = '#FFFFFF'
const GREY_100 = '#F5F5F5'
const GREY_300 = '#E0E0E0'
const GREY_400 = '#BDBDBD'
const GREY_600 = '#757575'
const GREY_700 = '#616161'
const GREY_800 = '#424242'

// Full Noto Sans TTFs (same family the mobile app uses) so the ₹ glyph renders.
let fontsRegistered = false
function ensureFonts() {
  if (fontsRegistered) return
  fontsRegistered = true
  const base = 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSans'
  Font.register({
    family: 'Noto Sans',
    fonts: [
      { src: `${base}/NotoSans-Regular.ttf`, fontWeight: 'normal' },
      { src: `${base}/NotoSans-Bold.ttf`, fontWeight: 'bold' },
      { src: `${base}/NotoSans-Italic.ttf`, fontStyle: 'italic', fontWeight: 'normal' },
      { src: `${base}/NotoSans-BoldItalic.ttf`, fontStyle: 'italic', fontWeight: 'bold' }
    ]
  })
  // Keep long tokens (order / payment IDs) intact instead of inserting hyphens.
  Font.registerHyphenationCallback((word) => [word])
}

const styles = StyleSheet.create({
  page: { fontFamily: 'Noto Sans', fontSize: 10, color: GREY_800 },

  // Header band
  headerBand: {
    backgroundColor: BRAND_SECONDARY,
    paddingHorizontal: 40,
    paddingVertical: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoEmblem: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: BRAND_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: { fontSize: 16, fontWeight: 'bold', color: BRAND_SECONDARY, letterSpacing: 1 },
  brandTitle: { fontSize: 14, fontWeight: 'bold', color: WHITE },
  brandSubtitle: { fontSize: 9, fontStyle: 'italic', color: GREY_300, marginTop: 4 },
  headerRight: { alignItems: 'flex-end' },
  invoiceWord: { fontSize: 22, fontWeight: 'bold', color: WHITE },
  headerNote: { fontSize: 8, color: GREY_300, marginTop: 4 },

  // Body
  body: { paddingHorizontal: 40, paddingTop: 28, paddingBottom: 24, flexGrow: 1 },

  metaRow: { flexDirection: 'row', alignItems: 'flex-start' },
  label: { fontSize: 9, fontWeight: 'bold', color: BRAND_SECONDARY, letterSpacing: 0.8 },
  strongValue: { fontSize: 11, fontWeight: 'bold' },
  value: { fontSize: 10, color: GREY_800 },
  smallValue: { fontSize: 8, color: GREY_800 },

  metaItemLabel: { fontSize: 8, color: GREY_600 },
  metaItemValue: { fontSize: 9, fontWeight: 'bold', marginTop: 3 },

  // Line-items table
  table: { borderWidth: 0.5, borderColor: GREY_400 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: BRAND_SECONDARY },
  tableRow: { flexDirection: 'row' },
  headerCell: { paddingHorizontal: 10, paddingVertical: 10, fontSize: 10, fontWeight: 'bold', color: WHITE },
  bodyCell: { paddingHorizontal: 10, paddingVertical: 12, fontSize: 10 },
  cellDivider: { borderRightWidth: 0.5, borderRightColor: GREY_400 },
  colSr: { width: 58 },
  colDesc: { flexGrow: 4, flexBasis: 0 },
  colDuration: { flexGrow: 1.5, flexBasis: 0 },
  colAmount: { flexGrow: 1.5, flexBasis: 0 },

  // Totals
  totalsWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  totalsBox: { width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 10, color: GREY_700 },
  totalValue: { fontSize: 10, fontWeight: 'bold' },
  totalsDivider: { borderBottomWidth: 0.5, borderBottomColor: GREY_400, marginVertical: 8 },
  grandTotalBox: {
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  grandTotalLabel: { fontSize: 12, fontWeight: 'bold', color: BRAND_SECONDARY },
  grandTotalValue: { fontSize: 14, fontWeight: 'bold', color: BRAND_SECONDARY },

  // Payment details
  paymentBox: {
    marginTop: 28,
    padding: 14,
    backgroundColor: GREY_100,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: GREY_300
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  chip: { marginRight: 24, marginBottom: 6 },
  chipLabel: { fontSize: 8, color: GREY_600 },
  chipValue: { fontSize: 9, fontWeight: 'bold', marginTop: 2 },

  // Footer
  footerDivider: { borderBottomWidth: 0.5, borderBottomColor: GREY_300, marginTop: 24, marginBottom: 10 },
  footerNote: { fontSize: 8, color: GREY_600, textAlign: 'center' },
  footerThanks: { fontSize: 9, color: GREY_700, fontStyle: 'italic', textAlign: 'center', marginTop: 6 }
})

function pick(...values) {
  for (const v of values) {
    if (v !== null && typeof v !== 'undefined' && v !== '') return v
  }
  return undefined
}

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(amount, currency = 'INR') {
  const safe = toNumber(amount)
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(safe)
  } catch {
    return `${currency || 'INR'} ${safe.toFixed(2)}`
  }
}

function formatDate(value) {
  if (!value) return 'N/A'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

// Maps an admin order/payment object to the fields the invoice renders.
export function mapOrderToInvoice(order = {}) {
  const subscription = order.subscription && typeof order.subscription === 'object' ? order.subscription : {}
  const user = order.user && typeof order.user === 'object' ? order.user : {}

  const planPrice = toNumber(pick(subscription.price, subscription.totalPrice, order.originalAmount, 0))
  const gstPercent = toNumber(subscription.gstPercent)
  const gstAmount = Math.round((planPrice * gstPercent) / 100)
  const totalPaid = toNumber(
    pick(
      order.amountInr,
      order.paidAmount,
      order.discountedAmount,
      order.amount != null ? order.amount / 100 : undefined,
      planPrice
    )
  )

  return {
    invoiceNo: pick(order.receipt, order.orderNumber, order._id, order.id, 'N/A'),
    invoiceDate: formatDate(pick(order.createdAt, order.orderDate)),
    status: String(pick(order.status, order.paymentStatus, 'N/A')).toUpperCase(),
    currency: pick(order.currency, 'INR'),

    customerName: pick(user.fullName, user.name, 'Customer'),
    customerEmail: pick(user.email),
    customerMobile: pick(user.mobileNumber, user.phone, user.mobile),

    planName: pick(subscription.name, subscription.title, 'Subscription Plan'),
    durationDays: toNumber(subscription.durationDays),
    planPrice,
    gstPercent,
    gstAmount,
    subtotal: planPrice,
    totalPaid,

    provider: String(pick(order.provider, 'razorpay')).toUpperCase(),
    orderId: pick(order.razorpayOrderId, order.gatewayOrderId, 'N/A'),
    paymentId: pick(order.razorpayPaymentId, 'N/A')
  }
}

export function buildInvoiceFileName(order = {}) {
  const receipt = pick(order.receipt, order.orderNumber, order._id, order.id, 'invoice')
  return `FMF_Invoice_${receipt}.pdf`
}

function MetaItem({ label, value }) {
  return (
    <View>
      <Text style={styles.metaItemLabel}>{label}</Text>
      <Text style={styles.metaItemValue}>{value}</Text>
    </View>
  )
}

function Chip({ label, value }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  )
}

export function InvoiceDocument({ order }) {
  const inv = mapOrderToInvoice(order)
  return (
    <Document title={`Invoice ${inv.invoiceNo}`} author="Family Medicine Flashback">
      <Page size="A4" style={styles.page}>
        {/* Header band */}
        <View style={styles.headerBand}>
          <View style={styles.headerLeft}>
            <View style={styles.logoEmblem}>
              <Text style={styles.logoText}>FMF</Text>
            </View>
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.brandTitle}>Family Medicine Flashback</Text>
              <Text style={styles.brandSubtitle}>Your Online Pocket Mentor</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceWord}>INVOICE</Text>
            <Text style={styles.headerNote}>Original for Recipient</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Bill from / Bill to / Meta */}
          <View style={styles.metaRow}>
            <View style={{ flexGrow: 3, flexBasis: 0 }}>
              <Text style={styles.label}>BILL FROM</Text>
              <Text style={[styles.strongValue, { marginTop: 6 }]}>Family Medicine Flashback</Text>
              <Text style={[styles.value, { marginTop: 2 }]}>Thilor, Bhiwani - 127040</Text>
              <Text style={[styles.value, { marginTop: 2 }]}>help@familymedicineflashback.com</Text>
            </View>

            <View style={{ flexGrow: 2, flexBasis: 0, marginLeft: 16 }}>
              <Text style={styles.label}>BILL TO</Text>
              <Text style={[styles.strongValue, { marginTop: 6 }]}>{inv.customerName}</Text>
              {inv.customerEmail ? <Text style={[styles.smallValue, { marginTop: 2 }]}>{inv.customerEmail}</Text> : null}
              {inv.customerMobile ? <Text style={[styles.smallValue, { marginTop: 2 }]}>{inv.customerMobile}</Text> : null}
            </View>

            <View style={{ flexGrow: 2, flexBasis: 0, marginLeft: 16 }}>
              <MetaItem label="Invoice No." value={inv.invoiceNo} />
              <View style={{ height: 8 }} />
              <MetaItem label="Invoice Date" value={inv.invoiceDate} />
              <View style={{ height: 8 }} />
              <MetaItem label="Payment Status" value={inv.status} />
            </View>
          </View>

          {/* Line-items table */}
          <View style={[styles.table, { marginTop: 28 }]}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, styles.colSr, styles.cellDivider, { textAlign: 'center' }]}>Sr. No.</Text>
              <Text style={[styles.headerCell, styles.colDesc, styles.cellDivider]}>Description</Text>
              <Text style={[styles.headerCell, styles.colDuration, styles.cellDivider]}>Duration</Text>
              <Text style={[styles.headerCell, styles.colAmount, { textAlign: 'right' }]}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.bodyCell, styles.colSr, styles.cellDivider, { textAlign: 'center' }]}>1</Text>
              <Text style={[styles.bodyCell, styles.colDesc, styles.cellDivider]}>{inv.planName}</Text>
              <Text style={[styles.bodyCell, styles.colDuration, styles.cellDivider]}>{inv.durationDays} Days</Text>
              <Text style={[styles.bodyCell, styles.colAmount, { textAlign: 'right' }]}>
                {formatCurrency(inv.planPrice, inv.currency)}
              </Text>
            </View>
          </View>

          {/* Totals */}
          <View style={styles.totalsWrap}>
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(inv.subtotal, inv.currency)}</Text>
              </View>
              {inv.gstPercent > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{`GST (${inv.gstPercent}%)`}</Text>
                  <Text style={styles.totalValue}>{formatCurrency(inv.gstAmount, inv.currency)}</Text>
                </View>
              ) : null}
              <View style={styles.totalsDivider} />
              <View style={styles.grandTotalBox}>
                <Text style={styles.grandTotalLabel}>Total Paid</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(inv.totalPaid, inv.currency)}</Text>
              </View>
            </View>
          </View>

          {/* Payment details */}
          <View style={styles.paymentBox}>
            <Text style={styles.label}>Payment Details</Text>
            <View style={styles.chipsWrap}>
              <Chip label="Provider" value={inv.provider} />
              <Chip label="Currency" value={inv.currency} />
              <Chip label="Order ID" value={inv.orderId} />
              <Chip label="Payment ID" value={inv.paymentId} />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerDivider} />
          <Text style={styles.footerNote}>This is a computer-generated invoice and does not require a signature.</Text>
          <Text style={styles.footerThanks}>Thank you for subscribing to FMF!</Text>
        </View>
      </Page>
    </Document>
  )
}

// Generates the styled PDF in the browser and triggers a download.
export async function downloadInvoice(order) {
  ensureFonts()
  const blob = await pdf(<InvoiceDocument order={order} />).toBlob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = buildInvoiceFileName(order)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
