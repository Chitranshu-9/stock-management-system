import { Printer, Download, Share2 } from 'lucide-react';

export default function Invoice() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Invoice #INV-2026/001</h1>
                    <p className="text-muted-foreground text-sm mt-1">Generated on 14 Aug 2026</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-input bg-card rounded-md hover:bg-secondary text-foreground text-sm font-medium transition-colors">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-input bg-card rounded-md hover:bg-secondary text-foreground text-sm font-medium transition-colors">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium transition-colors">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>
            </div>

            <div className="bg-white text-black p-8 rounded-xl shadow-sm border border-border border-b-8 border-b-primary font-sans relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
                    <span className="text-[10rem] font-bold rotate-[-30deg] block">StockAI</span>
                </div>

                <div className="flex justify-between items-start mb-10">
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
                            <p><span className="font-semibold text-gray-900 mr-2">Invoice No:</span> INV-2026/001</p>
                            <p><span className="font-semibold text-gray-900 mr-2">Date:</span> 14 Aug 2026</p>
                            <p><span className="font-semibold text-gray-900 mr-2">Place of Supply:</span> Karnataka (29)</p>
                        </div>
                    </div>
                </div>

                <div className="mb-8 border border-gray-200 rounded-lg p-4 bg-gray-50 flex gap-8">
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-2">Billed To:</h3>
                        <p className="font-semibold">Acme Retailers</p>
                        <p className="text-sm text-gray-600 leading-relaxed mt-1">
                            456 Commerce Avenue, Phase 2<br />
                            Bengaluru, Karnataka 560034<br />
                            GSTIN: 29XYZPT9876Q1Z2
                        </p>
                    </div>
                    <div className="flex-1 border-l border-gray-200 pl-8">
                        <h3 className="font-bold text-gray-900 mb-2">Payment Details:</h3>
                        <p className="text-sm text-gray-600">Method: <span className="font-medium text-gray-900">UPI / Cash</span></p>
                        <p className="text-sm text-gray-600">Status: <span className="font-medium text-green-600">Paid in Full</span></p>
                    </div>
                </div>

                <table className="w-full text-sm mb-8 border border-gray-200">
                    <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-200">
                        <tr>
                            <th className="py-3 px-4 text-left border-r border-gray-200">#</th>
                            <th className="py-3 px-4 text-left border-r border-gray-200">Description</th>
                            <th className="py-3 px-4 text-left border-r border-gray-200">HSN</th>
                            <th className="py-3 px-4 text-right border-r border-gray-200">Qty</th>
                            <th className="py-3 px-4 text-right border-r border-gray-200">Rate</th>
                            <th className="py-3 px-4 text-right border-r border-gray-200">Taxable Val</th>
                            <th className="py-3 px-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 divide-y divide-gray-200">
                        <tr>
                            <td className="py-3 px-4 border-r border-gray-200">1</td>
                            <td className="py-3 px-4 border-r border-gray-200">Premium Cooking Oil 1L</td>
                            <td className="py-3 px-4 border-r border-gray-200">1516</td>
                            <td className="py-3 px-4 text-right border-r border-gray-200">10</td>
                            <td className="py-3 px-4 text-right border-r border-gray-200">450.00</td>
                            <td className="py-3 px-4 text-right border-r border-gray-200">4,500.00</td>
                            <td className="py-3 px-4 text-right">4,500.00</td>
                        </tr>
                        <tr>
                            <td className="py-3 px-4 border-r border-gray-200">2</td>
                            <td className="py-3 px-4 border-r border-gray-200">Herbal Shampoo 200ml</td>
                            <td className="py-3 px-4 border-r border-gray-200">3305</td>
                            <td className="py-3 px-4 text-right border-r border-gray-200">5</td>
                            <td className="py-3 px-4 text-right border-r border-gray-200">140.00</td>
                            <td className="py-3 px-4 text-right border-r border-gray-200">700.00</td>
                            <td className="py-3 px-4 text-right">700.00</td>
                        </tr>
                    </tbody>
                </table>

                <div className="flex justify-end mb-10">
                    <div className="w-1/2">
                        <table className="w-full text-sm text-gray-700">
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="py-2 text-right font-medium pr-6">Total Taxable Value:</td>
                                    <td className="py-2 text-right">₹ 5,200.00</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-2 text-right font-medium pr-6 text-gray-500">CGST (9%):</td>
                                    <td className="py-2 text-right">₹ 468.00</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="py-2 text-right font-medium pr-6 text-gray-500">SGST (9%):</td>
                                    <td className="py-2 text-right">₹ 468.00</td>
                                </tr>
                                <tr className="text-lg text-gray-900 border-b-2 border-gray-300 bg-gray-50">
                                    <td className="py-3 text-right font-bold pr-6">Grand Total:</td>
                                    <td className="py-3 text-right font-bold text-primary">₹ 6,136.00</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="text-right text-xs text-gray-500 mt-2 font-medium">AMOUNT IN WORDS</p>
                        <p className="text-right text-sm text-gray-800 italic">Rupees Six Thousand One Hundred Thirty-Six Only.</p>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6 text-xs text-gray-500">
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
