import { Printer, Download, Share2, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function Invoice() {
    const location = useLocation();
    const navigate = useNavigate();
    const invoiceData = location.state?.invoiceData;

    useEffect(() => {
        // Enforce media print CSS natively without global stylesheet pollution
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                .print-hidden { display: none !important; }
                body { 
                    background-color: white !important; 
                    margin: 0 !important; 
                    padding: 0 !important; 
                }
                #invoice-canvas {
                    border: none !important;
                    box-shadow: none !important;
                    border-bottom: 8px solid hsl(221, 83%, 53%) !important; 
                    padding: 20px !important;
                }
                @page {
                    size: A4 portrait;
                    margin: 10mm;
                }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    if (!invoiceData) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <p className="text-muted-foreground">Invoice Session Expired or Not Found.</p>
                <button onClick={() => navigate('/sales/pos')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Return to POS</button>
            </div>
        );
    }

    const { invoiceNumber, date, items, customerDetails, totalValuation } = invoiceData;

    // Mathematical Formatting
    const parsedDate = new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const cgst = totalValuation * 0.09;
    const sgst = totalValuation * 0.09;
    const grandTotal = totalValuation + cgst + sgst;

    const printInvoice = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <Link to="/sales/pos" className="print-hidden inline-flex items-center text-sm font-medium hover:text-primary transition-colors text-muted-foreground mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to POS Checkout
            </Link>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print-hidden mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Invoice #{invoiceNumber}</h1>
                    <p className="text-muted-foreground text-sm mt-1">Generated on {parsedDate}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-input bg-card rounded-md hover:bg-secondary text-foreground text-sm font-medium transition-colors">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button onClick={printInvoice} className="flex items-center gap-2 px-4 py-2 border border-input bg-card rounded-md hover:bg-secondary text-foreground text-sm font-medium transition-colors">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button onClick={printInvoice} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium transition-colors">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>
            </div>

            <div className="bg-white text-black p-8 rounded-xl shadow-sm border border-border border-b-8 border-b-primary font-sans relative overflow-hidden" id="invoice-canvas">
                {/* Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
                    <span className="text-[10rem] font-bold rotate-[-30deg] block">StockAI</span>
                </div>

                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                        <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-xl mb-4">
                            S
                        </div>
                        <h2 className="text-xl font-bold">Super Store</h2>
                        <p className="text-sm text-gray-600 leading-relaxed mt-1">
                            123 Market Road, Tech Hub<br />
                            Bengaluru, Karnataka 560100<br />
                            GSTIN: 29ABCDE1234F1Z5
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-gray-200">TAX INVOICE</h2>
                        <div className="mt-4 text-sm text-gray-600">
                            <p><span className="font-semibold text-gray-900 mr-2">Invoice No:</span> {invoiceNumber}</p>
                            <p><span className="font-semibold text-gray-900 mr-2">Date:</span> {parsedDate}</p>
                            <p><span className="font-semibold text-gray-900 mr-2">Place of Supply:</span> Karnataka (29)</p>
                        </div>
                    </div>
                </div>

                <div className="mb-8 border border-gray-200 rounded-lg p-4 bg-gray-50 flex gap-8 relative z-10">
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-2">Billed To:</h3>
                        <p className="font-semibold">{customerDetails.name}</p>
                        <p className="text-sm text-gray-600 leading-relaxed mt-1">
                            Phone: {customerDetails.phone}<br />
                            GSTIN: {customerDetails.gstin}
                        </p>
                    </div>
                    <div className="flex-1 border-l border-gray-200 pl-8">
                        <h3 className="font-bold text-gray-900 mb-2">Payment Details:</h3>
                        <p className="text-sm text-gray-600">Method: <span className="font-medium text-gray-900">Retail Native / POS Checkout</span></p>
                        <p className="text-sm text-gray-600">Status: <span className="font-medium text-green-600">Paid in Full</span></p>
                    </div>
                </div>

                <table className="w-full text-sm mb-8 border border-gray-200 relative z-10 bg-white">
                    <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-200">
                        <tr>
                            <th className="py-3 px-4 text-left border-r border-gray-200 w-12">#</th>
                            <th className="py-3 px-4 text-left border-r border-gray-200">Description</th>
                            <th className="py-3 px-4 text-left border-r border-gray-200">HSN</th>
                            <th className="py-3 px-4 text-right border-r border-gray-200">Qty</th>
                            <th className="py-3 px-4 text-right border-r border-gray-200">Rate</th>
                            <th className="py-3 px-4 text-right border-r border-gray-200">Taxable Val</th>
                            <th className="py-3 px-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 divide-y divide-gray-200">
                        {items.map((item: any, idx: number) => (
                            <tr key={idx}>
                                <td className="py-3 px-4 border-r border-gray-200">{idx + 1}</td>
                                <td className="py-3 px-4 border-r border-gray-200 font-medium">{item.name}</td>
                                <td className="py-3 px-4 border-r border-gray-200">9988</td>
                                <td className="py-3 px-4 text-right border-r border-gray-200">{item.qty}</td>
                                <td className="py-3 px-4 text-right border-r border-gray-200">{item.price.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right border-r border-gray-200">{(item.qty * item.price).toFixed(2)}</td>
                                <td className="py-3 px-4 text-right">{(item.qty * item.price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mb-10 relative z-10">
                    <div className="w-1/2">
                        <table className="w-full text-sm text-gray-700">
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="py-2 text-right font-medium pr-6">Total Taxable Value:</td>
                                    <td className="py-2 text-right">₹ {totalValuation.toFixed(2)}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-2 text-right font-medium pr-6 text-gray-500">CGST (9%):</td>
                                    <td className="py-2 text-right">₹ {cgst.toFixed(2)}</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-2 text-right font-medium pr-6 text-gray-500">SGST (9%):</td>
                                    <td className="py-2 text-right">₹ {sgst.toFixed(2)}</td>
                                </tr>
                                <tr className="text-lg text-gray-900 border-b-2 border-gray-300 bg-gray-50">
                                    <td className="py-3 text-right font-bold pr-6">Grand Total:</td>
                                    <td className="py-3 text-right font-bold text-primary">₹ {grandTotal.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6 text-xs text-gray-500 relative z-10">
                    <p className="font-bold text-gray-700 mb-1">Terms & Conditions:</p>
                    <ul className="list-disc list-inside">
                        <li>Subject to Bengaluru jurisdiction.</li>
                        <li>Goods once sold will not be taken back or exchanged.</li>
                    </ul>
                    <div className="mt-8 text-right font-bold text-gray-700">Authorized Signatory</div>
                </div>
            </div>
        </div>
    );
}
