import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";

// Unified font size for the entire PDF
const FONT_SIZE = 9;

// Helper for generic number formatting
const formatAmount = (amount: number) => `Rs ${amount.toFixed(2)}`;

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: FONT_SIZE, fontFamily: "Helvetica", color: "#000" },
  headerText: { fontSize: FONT_SIZE, fontWeight: "bold", textAlign: "center", borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 5, marginBottom: 10 },
  row: { flexDirection: "row" },
  col50: { width: "50%", padding: 5 },
  col55: { width: "55%", padding: 5, borderRightWidth: 1, borderRightColor: "#000" },
  col45: { width: "45%", padding: 5 },
  borderBox: { borderWidth: 1, borderColor: "#000", marginBottom: 10 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: "#000" },
  boldText: { fontFamily: "Helvetica-Bold", fontWeight: "bold" },
  smallText: { fontSize: FONT_SIZE },
  textLine: { marginBottom: 2 },
  
  // Table & Layout Styles
  logo: { width: 80, height: 80, marginBottom: 8 },
  colLogo: { width: "20%", padding: 5 },
  colDetails: { width: "80%", padding: 5 },
  table: { width: "100%", borderTopWidth: 1, borderTopColor: "#000", borderBottomWidth: 1, borderBottomColor: "#000" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f0f0f0", borderBottomWidth: 1, borderBottomColor: "#000", alignItems: "center" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 4 },
  tableColDesc: { width: "35%", paddingHorizontal: 4, fontSize: FONT_SIZE },
  tableColSmall: { width: "13%", textAlign: "center", paddingHorizontal: 4, fontSize: FONT_SIZE },
  tableColRate: { width: "12%", textAlign: "right", paddingHorizontal: 4, fontSize: FONT_SIZE },
  tableColPer: { width: "8%", textAlign: "center", paddingHorizontal: 4, fontSize: FONT_SIZE },
  tableColAmount: { width: "19%", textAlign: "right", paddingHorizontal: 4, fontSize: FONT_SIZE },
});

export const InvoicePDF = ({ data, settings }: { data: any; settings: any }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={[styles.headerText, styles.boldText]}>TAX INVOICE</Text>
        
        <View style={styles.borderBox}>
          {/* Invoice Number and Date on top */}
          <View style={[styles.row, styles.borderBottom]}>
            <View style={styles.col45}>
              <View style={[styles.row, { marginBottom: 4 }]}>
                <View style={{ width: "50%" }}>
                  <Text style={styles.smallText}>Invoice No.</Text>
                  <Text>{data?.invoiceNo}</Text>
                </View>
                <View style={{ width: "50%" }}>
                  <Text style={styles.smallText}>Dated</Text>
                  <Text>{new Date(data?.dated || Date.now()).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          </View>
          {/* Company Info with logo on left and details on right */}
          <View style={styles.row}>
            <View style={styles.colLogo}>
              {settings?.logoUrl && <Image src={settings.logoUrl} style={styles.logo} />}
            </View>
            <View style={styles.colDetails}>
              <Text style={{ fontSize: FONT_SIZE, marginBottom: 4 }}>{settings?.companyName}</Text>
              {settings?.addressLines?.map((line: string, i: number) => (
                <Text key={i} style={styles.textLine}>{line}</Text>
              ))}
              <Text style={styles.textLine}><Text style={styles.boldText}>GSTIN/UIN: </Text>{settings?.gstinUin}</Text>
              <Text style={styles.textLine}><Text style={styles.boldText}>State Name: </Text>{settings?.stateName} <Text style={styles.boldText}>Code: </Text>{settings?.stateCode}</Text>
              <Text style={styles.textLine}><Text style={styles.boldText}>E-Mail: </Text>{settings?.email}</Text>
            </View>
          </View>

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: "#000" }]}>
            <View style={styles.col50}>
              <Text style={[styles.smallText, styles.boldText, { marginBottom: 2 }]}>Consignee (Ship to)</Text>
              <Text>{data?.consignee?.companyName}</Text>
              <Text style={styles.textLine}>GSTIN/UIN: {data?.consignee?.gstinUin}</Text>
              <Text style={styles.textLine}>State: {data?.consignee?.stateName} ({data?.consignee?.stateCode})</Text>
            </View>
            <View style={[styles.col50, { borderLeftWidth: 1, borderLeftColor: "#000" }]}>
              <Text style={[styles.smallText, styles.boldText, { marginBottom: 2 }]}>Buyer (Bill to)</Text>
              <Text>{data?.buyer?.companyName}</Text>
              <Text style={styles.textLine}>GSTIN/UIN: {data?.buyer?.gstinUin}</Text>
              <Text style={styles.textLine}>State: {data?.buyer?.stateName} ({data?.buyer?.stateCode})</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableHeader, { paddingVertical: 4 }]}>
            <Text style={[styles.tableColDesc, styles.boldText]}>Description of Goods</Text>
            <Text style={[styles.tableColSmall, styles.boldText]}>HSN/SAC</Text>
            <Text style={[styles.tableColSmall, styles.boldText]}>Quantity</Text>
            <Text style={[styles.tableColRate, styles.boldText]}>Rate</Text>
            <Text style={[styles.tableColPer, styles.boldText]}>per</Text>
            <Text style={[styles.tableColAmount, styles.boldText]}>Amount</Text>
          </View>
          
          {data?.lineItems?.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableColDesc}>{item.description}</Text>
              <Text style={styles.tableColSmall}>{item.hsnSac}</Text>
              <Text style={styles.tableColSmall}>{item.quantity}</Text>
              <Text style={styles.tableColRate}>{item.rate?.toFixed(2)}</Text>
              <Text style={styles.tableColPer}>{item.unit}</Text>
              <Text style={styles.tableColAmount}>{item.amount?.toFixed(2)}</Text>
            </View>
          ))}

          {/* Insert gap rows when few items */}
          {(data?.lineItems?.length ?? 0) <= 5 && Array.from({ length: 3 }).map((_, idx) => (
            <View key={`gap-${idx}`} style={styles.tableRow}>
              <Text style={styles.tableColDesc}> </Text>
              <Text style={styles.tableColSmall}> </Text>
              <Text style={styles.tableColSmall}> </Text>
              <Text style={styles.tableColRate}> </Text>
              <Text style={styles.tableColPer}> </Text>
              <Text style={styles.tableColAmount}> </Text>
            </View>
          ))}

          {/* Taxes */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableColDesc, { textAlign: 'right', width: "73%" }]}><Text>CGST</Text></Text>
            <Text style={styles.tableColPer}>{data?.totals?.totalTax ? " " : ""}</Text>
            <Text style={styles.tableColAmount}>{data?.totals?.cgstTotal?.toFixed(2)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableColDesc, { textAlign: 'right', width: "73%" }]}><Text>SGST</Text></Text>
            <Text style={styles.tableColPer}>{data?.totals?.totalTax ? " " : ""}</Text>
            <Text style={styles.tableColAmount}>{data?.totals?.sgstTotal?.toFixed(2)}</Text>
          </View>

          {/* Round Off */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableColDesc, { textAlign: 'right', width: "81%" }]}><Text>Round Off</Text></Text>
            <Text style={styles.tableColAmount}>{data?.totals?.roundOff?.toFixed(2)}</Text>
          </View>

          {/* Total */}
          <View style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: "#000", borderBottomWidth: 0 }]}>
            <Text style={[styles.tableColDesc, { textAlign: 'right', width: "48%" }]}><Text>Total</Text></Text>
            <Text style={styles.tableColSmall}>{data?.totals?.totalQuantity}</Text>
            <Text style={{ width: "20%" }}></Text>
            <Text style={styles.tableColAmount}>{formatAmount(data?.totals?.grandTotal || 0)}</Text>
          </View>
        </View>

        <View style={[styles.borderBox, { marginTop: 10 }]}>
          <View style={{ padding: 5, borderBottomWidth: 1, borderBottomColor: "#000" }}>
            <Text style={styles.smallText}>Amount Chargeable (in words)</Text>
            <Text>INR {data?.totals?.amountInWords} Only</Text>
          </View>
          
          <View style={[styles.row]}>
            <View style={styles.col55}>
              <Text style={styles.smallText}>Declaration</Text>
              <Text style={{ fontSize: FONT_SIZE }}>{settings?.footer?.declaration}</Text>
            </View>
            <View style={styles.col45}>
              <Text style={[styles.smallText, { marginBottom: 4 }]}>Company's Bank Details</Text>
              <Text style={styles.textLine}>Bank Name: {settings?.bankDetails?.bankName}</Text>
              <Text style={styles.textLine}>A/c No.: {settings?.bankDetails?.accountNo}</Text>
              <Text style={styles.textLine}>Branch & IFS Code: {settings?.bankDetails?.branch} | {settings?.bankDetails?.ifscCode}</Text>
              
              <View style={{ marginTop: 20, alignItems: "flex-end" }}>
                <Text style={[styles.boldText, { marginBottom: 20 }]}>for {settings?.companyName}</Text>
                <Text>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>
        
        <Text style={[styles.smallText, { textAlign: "center", marginTop: 5 }]}>{settings?.footer?.jurisdictionNote}</Text>
        <Text style={[styles.smallText, { textAlign: "center", marginTop: 2 }]}>{settings?.footer?.computerGeneratedNote}</Text>

      </Page>
    </Document>
  );
};
