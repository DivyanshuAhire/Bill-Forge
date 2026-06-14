import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";

// Helper for generic number formatting
const formatAmount = (amount: number) => `Rs ${amount.toFixed(2)}`;

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#000" },
  headerText: { fontSize: 14, fontWeight: "bold", textAlign: "center", borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 5, marginBottom: 10 },
  row: { flexDirection: "row" },
  col50: { width: "50%", padding: 5 },
  col55: { width: "55%", padding: 5, borderRightWidth: 1, borderRightColor: "#000" },
  col45: { width: "45%", padding: 5 },
  borderBox: { borderWidth: 1, borderColor: "#000", marginBottom: 10 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: "#000" },
  boldText: { fontFamily: "Helvetica-Bold", fontWeight: "bold" },
  smallText: { fontSize: 7 },
  textLine: { marginBottom: 2 },
  
  // Table Styles
  table: { width: "100%", borderTopWidth: 1, borderTopColor: "#000", borderBottomWidth: 1, borderBottomColor: "#000" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f0f0f0", borderBottomWidth: 1, borderBottomColor: "#000", alignItems: "center" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 4 },
  tableColDesc: { width: "35%", paddingHorizontal: 4 },
  tableColSmall: { width: "13%", textAlign: "center", paddingHorizontal: 4 },
  tableColRate: { width: "12%", textAlign: "right", paddingHorizontal: 4 },
  tableColPer: { width: "8%", textAlign: "center", paddingHorizontal: 4 },
  tableColAmount: { width: "19%", textAlign: "right", paddingHorizontal: 4 },
});

export const InvoicePDF = ({ data, settings }: { data: any; settings: any }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={[styles.headerText, styles.boldText]}>TAX INVOICE</Text>
        
        <View style={styles.borderBox}>
          <View style={[styles.row, styles.borderBottom]}>
            <View style={styles.col55}>
              <Text style={[styles.boldText, { fontSize: 11, marginBottom: 4 }]}>{settings?.companyName}</Text>
              {settings?.addressLines?.map((line: string, i: number) => (
                <Text key={i} style={styles.textLine}>{line}</Text>
              ))}
              <Text style={styles.textLine}><Text style={styles.boldText}>GSTIN/UIN: </Text>{settings?.gstinUin}</Text>
              <Text style={styles.textLine}><Text style={styles.boldText}>State Name: </Text>{settings?.stateName} <Text style={styles.boldText}>Code: </Text>{settings?.stateCode}</Text>
              <Text style={styles.textLine}><Text style={styles.boldText}>E-Mail: </Text>{settings?.email}</Text>
            </View>
            <View style={styles.col45}>
              <View style={[styles.row, { marginBottom: 4 }]}>
                <View style={{ width: "50%" }}>
                  <Text style={styles.smallText}>Invoice No.</Text>
                  <Text style={styles.boldText}>{data?.invoiceNo}</Text>
                </View>
                <View style={{ width: "50%" }}>
                  <Text style={styles.smallText}>Dated</Text>
                  <Text style={styles.boldText}>{new Date(data?.dated || Date.now()).toLocaleDateString()}</Text>
                </View>
              </View>
              {/* Optional Meta fields can go here */}
            </View>
          </View>

          <View style={[styles.row]}>
            <View style={styles.col50}>
              <Text style={[styles.smallText, styles.boldText, { marginBottom: 2 }]}>Consignee (Ship to)</Text>
              <Text style={styles.boldText}>{data?.consignee?.companyName}</Text>
              <Text style={styles.textLine}>GSTIN/UIN: {data?.consignee?.gstinUin}</Text>
              <Text style={styles.textLine}>State: {data?.consignee?.stateName} ({data?.consignee?.stateCode})</Text>
            </View>
            <View style={[styles.col50, { borderLeftWidth: 1, borderLeftColor: "#000" }]}>
              <Text style={[styles.smallText, styles.boldText, { marginBottom: 2 }]}>Buyer (Bill to)</Text>
              <Text style={styles.boldText}>{data?.buyer?.companyName}</Text>
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

          {/* Taxes */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableColDesc, { textAlign: 'right', width: "73%" }]}><Text style={styles.boldText}>CGST</Text></Text>
            <Text style={styles.tableColPer}>{data?.totals?.totalTax ? " " : ""}</Text>
            <Text style={[styles.tableColAmount, styles.boldText]}>{data?.totals?.cgstTotal?.toFixed(2)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableColDesc, { textAlign: 'right', width: "73%" }]}><Text style={styles.boldText}>SGST</Text></Text>
            <Text style={styles.tableColPer}>{data?.totals?.totalTax ? " " : ""}</Text>
            <Text style={[styles.tableColAmount, styles.boldText]}>{data?.totals?.sgstTotal?.toFixed(2)}</Text>
          </View>

          {/* Round Off */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableColDesc, { textAlign: 'right', width: "81%" }]}><Text style={styles.boldText}>Round Off</Text></Text>
            <Text style={[styles.tableColAmount, styles.boldText]}>{data?.totals?.roundOff?.toFixed(2)}</Text>
          </View>

          {/* Total */}
          <View style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: "#000", borderBottomWidth: 0 }]}>
            <Text style={[styles.tableColDesc, { textAlign: 'right', width: "48%" }]}><Text style={styles.boldText}>Total</Text></Text>
            <Text style={[styles.tableColSmall, styles.boldText]}>{data?.totals?.totalQuantity}</Text>
            <Text style={{ width: "20%" }}></Text>
            <Text style={[styles.tableColAmount, styles.boldText]}>{formatAmount(data?.totals?.grandTotal || 0)}</Text>
          </View>
        </View>

        <View style={[styles.borderBox, { marginTop: 10 }]}>
          <View style={{ padding: 5, borderBottomWidth: 1, borderBottomColor: "#000" }}>
            <Text style={styles.smallText}>Amount Chargeable (in words)</Text>
            <Text style={styles.boldText}>INR {data?.totals?.amountInWords} Only</Text>
          </View>
          
          <View style={[styles.row]}>
            <View style={styles.col55}>
              <Text style={styles.smallText}>Declaration</Text>
              <Text style={{ fontSize: 8 }}>{settings?.footer?.declaration}</Text>
            </View>
            <View style={styles.col45}>
              <Text style={[styles.boldText, styles.smallText, { marginBottom: 4 }]}>Company's Bank Details</Text>
              <Text style={styles.textLine}><Text style={styles.boldText}>Bank Name: </Text>{settings?.bankDetails?.bankName}</Text>
              <Text style={styles.textLine}><Text style={styles.boldText}>A/c No.: </Text>{settings?.bankDetails?.accountNo}</Text>
              <Text style={styles.textLine}><Text style={styles.boldText}>Branch & IFS Code: </Text>{settings?.bankDetails?.branch} | {settings?.bankDetails?.ifscCode}</Text>
              
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
