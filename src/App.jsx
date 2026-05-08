import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  FileText, 
  BarChart2, 
  Download, 
  Printer, 
  Search, 
  CreditCard, 
  Truck, 
  Package, 
  Star,
  CheckCircle,
  XCircle,
  TrendingUp,
  MoreVertical,
  ChevronRight,
  Filter,
  FileDown,
  LayoutDashboard,
  ArrowRightLeft,
  Settings,
  HelpCircle,
  LogOut,
  Bell
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';

// Firebase imports
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from './firebase';

const App = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [activeSupplier, setActiveSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    moq: '',
    creditTerms: '',
    hasCredit: false,
    deliveryTime: '',
    rating: 5,
    productLines: '',
    contactName: '',
    email: '',
    phone: '',
    specialConditions: ''
  });

  // Load from Firebase
  useEffect(() => {
    try {
      const q = query(collection(db, "suppliers"), orderBy("dateAdded", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        setSuppliers(docs);
        setLoading(false);
      }, (error) => {
        console.error("Firebase error:", error);
        if (error.code === 'failed-precondition' || error.message.includes('YOUR_API_KEY')) {
          setIsFirebaseConfigured(false);
          // Fallback to local storage if Firebase fails
          const saved = localStorage.getItem('suppliers');
          setSuppliers(saved ? JSON.parse(saved) : []);
          setLoading(false);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      setIsFirebaseConfigured(false);
      const saved = localStorage.getItem('suppliers');
      setSuppliers(saved ? JSON.parse(saved) : []);
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newSupplier = {
      ...formData,
      dateAdded: new Date().toISOString(),
      moq: parseFloat(formData.moq) || 0,
      rating: parseInt(formData.rating) || 5
    };

    if (isFirebaseConfigured) {
      await addDoc(collection(db, "suppliers"), newSupplier);
    } else {
      const updated = [...suppliers, { ...newSupplier, id: Date.now().toString() }];
      setSuppliers(updated);
      localStorage.setItem('suppliers', JSON.stringify(updated));
    }
    
    setView('dashboard');
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      moq: '',
      creditTerms: '',
      hasCredit: false,
      deliveryTime: '',
      rating: 5,
      productLines: '',
      contactName: '',
      email: '',
      phone: '',
      specialConditions: ''
    });
  };

  const exportToPDF = (supplier) => {
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setTextColor(99, 102, 241); // Primary color
    doc.text(`Supplier Scorecard`, 14, 25);
    
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(supplier.name, 14, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 42);

    doc.autoTable({
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Category', supplier.category],
        ['MOQ (MXN)', `$${supplier.moq.toLocaleString()}`],
        ['Credit Status', supplier.hasCredit ? 'Available' : 'None'],
        ['Credit Terms', supplier.creditTerms || 'N/A'],
        ['Lead Time', supplier.deliveryTime],
        ['Contact', supplier.contactName],
        ['Rating', `${supplier.rating}/5 Stars`],
        ['Product Scope', supplier.productLines],
      ],
      headStyles: { fillColor: [99, 102, 241] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    
    doc.save(`${supplier.name}_Scorecard.pdf`);
  };

  const exportToWord = (supplier) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `SUPPLIER SCORECARD: ${supplier.name.toUpperCase()}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: "FIELD", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "DETAILS", bold: true })] }),
                ],
              }),
              ...[
                ["Category", supplier.category],
                ["MOQ", `$${supplier.moq.toLocaleString()} MXN`],
                ["Credit", supplier.hasCredit ? "Yes" : "No"],
                ["Terms", supplier.creditTerms || "N/A"],
                ["Lead Time", supplier.deliveryTime],
                ["Rating", `${supplier.rating}/5 Stars`],
                ["Product Lines", supplier.productLines],
                ["Notes", supplier.specialConditions || "None"],
              ].map(([field, value]) => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(field)] }),
                  new TableCell({ children: [new Paragraph(value)] }),
                ],
              })),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${supplier.name}_Scorecard.docx`);
    });
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(suppliers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");
    XLSX.writeFile(workbook, "HerraMax_Suppliers_Database.xlsx");
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar no-print">
        <div className="brand">
          <div className="brand-icon">
            <TrendingUp size={24} />
          </div>
          <div className="brand-name">
            HerraMax<br/><span>Scorecard</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className={`nav-link ${view === 'compare' ? 'active' : ''}`} onClick={() => setView('compare')}>
            <ArrowRightLeft size={20} /> Comparison Tool
          </button>
          <button className={`nav-link ${view === 'form' ? 'active' : ''}`} onClick={() => setView('form')}>
            <Plus size={20} /> Add Supplier
          </button>
        </nav>

        {!isFirebaseConfigured && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '12px', fontSize: '0.75rem' }}>
            <p style={{ color: 'var(--danger)', fontWeight: 700 }}>Firebase Not Configured</p>
            <p className="text-muted">Using local storage fallback. Edit src/firebase.js to enable cloud sync.</p>
          </div>
        )}

        <div className="user-profile">
          <div className="avatar">P</div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Paola Carvajal</p>
            <p className="text-muted" style={{ fontSize: '0.75rem' }}>Project Admin</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="section-header no-print">
          <div style={{ position: 'relative', width: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Quick search suppliers..." 
              style={{ width: '100%', paddingLeft: '3rem', background: 'var(--surface)', borderRadius: '12px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" title="Notifications"><Bell size={20}/></button>
            <button className="btn btn-outline" title="Settings"><Settings size={20}/></button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="section-header">
                <div>
                  <h2>Supplier Ecosystem</h2>
                  <p className="text-muted">Centralized intelligence for procurement decisions.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={exportToExcel}><Download size={18}/> Export Data</button>
                  <button className="btn btn-primary" onClick={() => setView('form')}><Plus size={18}/> New Analysis</button>
                </div>
              </div>

              <div className="stats-grid">
                <div className="card stat-card">
                  <div className="stat-header">
                    <div className="stat-icon"><Users size={20}/></div>
                    <span className="badge">Active</span>
                  </div>
                  <div>
                    <p className="stat-label">Total Suppliers</p>
                    <p className="stat-value">{suppliers.length}</p>
                  </div>
                </div>
                <div className="card stat-card">
                  <div className="stat-header">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)' }}><CreditCard size={20}/></div>
                    <span className="badge badge-success">Financial</span>
                  </div>
                  <div>
                    <p className="stat-label">Credit Partners</p>
                    <p className="stat-value">{suppliers.filter(s => s.hasCredit).length}</p>
                  </div>
                </div>
                <div className="card stat-card">
                  <div className="stat-header">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)' }}><Package size={20}/></div>
                  </div>
                  <div>
                    <p className="stat-label">Lead Time Avg</p>
                    <p className="stat-value">3.2<span style={{ fontSize: '1rem', marginLeft: '0.25rem' }}>days</span></p>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '0.5rem' }}>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Category</th>
                        <th>MOQ (MXN)</th>
                        <th>Credit</th>
                        <th>Rating</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliers.map(s => (
                        <tr key={s.id} onClick={() => { setActiveSupplier(s); setView('details'); }} style={{ cursor: 'pointer' }}>
                          <td>
                            <p style={{ fontWeight: 700 }}>{s.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {s.id.toString().slice(-4)}</p>
                          </td>
                          <td><span className="badge">{s.category}</span></td>
                          <td style={{ fontWeight: 600 }}>${s.moq?.toLocaleString()}</td>
                          <td>
                            {s.hasCredit ? 
                              <span className="badge badge-success">YES</span> : 
                              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>NO</span>
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} fill={i < s.rating ? 'var(--accent)' : 'none'} color="var(--accent)" />
                              ))}
                            </div>
                          </td>
                          <td>
                            <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={(e) => { e.stopPropagation(); setActiveSupplier(s); setView('details'); }}>
                              <ChevronRight size={18}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'form' && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="card animate-in"
              style={{ maxWidth: '900px', margin: '0 auto' }}
            >
              <div style={{ marginBottom: '2.5rem' }}>
                <button className="btn btn-outline" onClick={() => setView('dashboard')} style={{ marginBottom: '1.5rem' }}>
                  <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }}/> Back to Overview
                </button>
                <h2>New Scorecard Analysis</h2>
                <p className="text-muted">Enter vendor intelligence to generate comparison metrics.</p>
              </div>

              <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group">
                  <label>Supplier Legal Name</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. FerreAbasto S.A." />
                </div>
                <div className="form-group">
                  <label>Business Category</label>
                  <select name="category" required value={formData.category} onChange={handleInputChange}>
                    <option value="">Select Classification</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Tools">Tools</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Construction">Construction</option>
                    <option value="Hardware">General Hardware</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Minimum Order (Pesos)</label>
                  <input type="number" name="moq" required value={formData.moq} onChange={handleInputChange} placeholder="5000" />
                </div>
                <div className="form-group">
                  <label>Lead Time (Description)</label>
                  <input type="text" name="deliveryTime" value={formData.deliveryTime} onChange={handleInputChange} placeholder="Immediate / 3-5 days" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                    <input type="checkbox" name="hasCredit" checked={formData.hasCredit} onChange={handleInputChange} style={{ width: '20px', height: '20px' }} />
                    Active Credit Line Available
                  </label>
                </div>
                {formData.hasCredit && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Credit Terms & Conditions</label>
                    <input type="text" name="creditTerms" value={formData.creditTerms} onChange={handleInputChange} placeholder="e.g. 30 days net, 5% cash discount" />
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Product Specialization</label>
                  <textarea name="productLines" value={formData.productLines} onChange={handleInputChange} placeholder="List key categories or brands..." rows="3"></textarea>
                </div>
                <div className="form-group">
                  <label>Contact Representative</label>
                  <input type="text" name="contactName" value={formData.contactName} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Subjective Quality Rating (1-5)</label>
                  <input type="number" min="1" max="5" name="rating" value={formData.rating} onChange={handleInputChange} />
                </div>
                
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '1rem' }}>Commit Scorecard</button>
                  <button type="button" className="btn btn-outline" onClick={() => setView('dashboard')}>Discard</button>
                </div>
              </form>
            </motion.div>
          )}

          {view === 'details' && activeSupplier && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="animate-in"
            >
              <div className="section-header no-print">
                <button className="btn btn-outline" onClick={() => setView('dashboard')}>
                  <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }}/> Dashboard
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={() => window.print()}><Printer size={18}/> Print</button>
                  <button className="btn btn-outline" onClick={() => exportToPDF(activeSupplier)}><FileDown size={18}/> PDF</button>
                  <button className="btn btn-outline" onClick={() => exportToWord(activeSupplier)}><FileText size={18}/> Word</button>
                </div>
              </div>

              <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <h2 style={{ fontSize: '2.5rem' }}>{activeSupplier.name}</h2>
                    <span className="badge" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>{activeSupplier.category}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="text-muted">Performance Rating</p>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={24} fill={i < activeSupplier.rating ? 'var(--accent)' : 'none'} color="var(--accent)" />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Operational Profile</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div>
                        <label>Minimum Order Value</label>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>${activeSupplier.moq?.toLocaleString()} MXN</p>
                      </div>
                      <div>
                        <label>Logistics Lead Time</label>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeSupplier.deliveryTime || 'Varies'}</p>
                      </div>
                      <div>
                        <label>Product Coverage</label>
                        <p style={{ fontWeight: 500 }}>{activeSupplier.productLines}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Commercial Terms</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div>
                        <label>Credit Line</label>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeSupplier.hasCredit ? 'ACTIVE' : 'CASH ONLY'}</p>
                      </div>
                      {activeSupplier.hasCredit && (
                        <div>
                          <label>Approved Terms</label>
                          <p style={{ fontWeight: 500 }}>{activeSupplier.creditTerms}</p>
                        </div>
                      )}
                      <div>
                        <label>Primary Contact</label>
                        <p style={{ fontWeight: 600 }}>{activeSupplier.contactName}</p>
                        <p className="text-muted">{activeSupplier.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {activeSupplier.specialConditions && (
                  <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderLeft: '4px solid var(--primary)' }}>
                    <label style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Strategic Notes</label>
                    <p style={{ marginTop: '0.5rem' }}>{activeSupplier.specialConditions}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'compare' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="section-header">
                <div>
                  <h2>Strategic Comparison Matrix</h2>
                  <p className="text-muted">Comparative analysis of hardware supply chains.</p>
                </div>
                <button className="btn btn-primary" onClick={exportToExcel}><Download size={18}/> Export Matrix</button>
              </div>

              <div className="card" style={{ padding: '0.5rem', overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 5 }}>Vendor</th>
                      <th>Category</th>
                      <th>MOQ Sensitivity</th>
                      <th>Credit</th>
                      <th>Lead Time</th>
                      <th>Global Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700, position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 5 }}>{s.name}</td>
                        <td>{s.category}</td>
                        <td style={{ color: s.moq > 10000 ? 'var(--danger)' : 'var(--secondary)', fontWeight: 700 }}>
                          ${s.moq?.toLocaleString()}
                        </td>
                        <td>{s.hasCredit ? '✅ Enabled' : '❌ Cash'}</td>
                        <td>{s.deliveryTime}</td>
                        <td>
                          <div style={{ 
                            display: 'inline-block', 
                            padding: '0.4rem 1rem', 
                            borderRadius: '8px', 
                            fontWeight: 800,
                            background: s.rating >= 4 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: s.rating >= 4 ? 'var(--secondary)' : 'var(--danger)'
                          }}>
                            {s.rating}/5.0
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
