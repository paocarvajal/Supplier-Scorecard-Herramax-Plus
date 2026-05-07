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
  Filter
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('suppliers');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState('dashboard'); // 'dashboard', 'form', 'compare', 'details'
  const [activeSupplier, setActiveSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newSupplier = {
      ...formData,
      id: Date.now(),
      dateAdded: new Date().toLocaleDateString()
    };
    setSuppliers([...suppliers, newSupplier]);
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
    doc.setFontSize(20);
    doc.text(`Supplier Scorecard: ${supplier.name}`, 14, 22);
    
    doc.setFontSize(12);
    doc.autoTable({
      startY: 30,
      head: [['Condition', 'Details']],
      body: [
        ['Category', supplier.category],
        ['MOQ (MXN)', `$${supplier.moq}`],
        ['Has Credit', supplier.hasCredit ? 'Yes' : 'No'],
        ['Credit Terms', supplier.creditTerms || 'N/A'],
        ['Delivery Time', supplier.deliveryTime],
        ['Product Lines', supplier.productLines],
        ['Contact', supplier.contactName],
        ['Email', supplier.email],
        ['Phone', supplier.phone],
        ['Rating', `${supplier.rating}/5`],
      ],
    });
    
    doc.save(`${supplier.name}_Scorecard.pdf`);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(suppliers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");
    XLSX.writeFile(workbook, "Suppliers_Comparison.xlsx");
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <div style={{ background: 'var(--accent)', padding: '0.5rem', borderRadius: '8px' }}>
            <TrendingUp size={24} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>HerraMax<br/><span style={{ opacity: 0.6 }}>SCORECARD</span></h1>
        </div>

        <nav style={{ display: 'flex', flex_direction: 'column', gap: '0.5rem' }}>
          <button className={`btn btn-sidebar ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <BarChart2 size={20} /> Dashboard
          </button>
          <button className={`btn btn-sidebar ${view === 'compare' ? 'active' : ''}`} onClick={() => setView('compare')}>
            <Users size={20} /> Comparison Tool
          </button>
          <button className="btn btn-sidebar" onClick={() => setView('form')}>
            <Plus size={20} /> Add Supplier
          </button>
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Logged in as</p>
          <p style={{ fontWeight: 600 }}>Admin Paola</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="section-title">
                <div>
                  <h2>Supplier Ecosystem</h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>Overview of all registered hardware suppliers.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={exportToExcel}><Download size={18}/> Export All</button>
                  <button className="btn btn-primary" onClick={() => setView('form')}><Plus size={18}/> New Supplier</button>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search by name or category..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Stats */}
              <div className="grid" style={{ marginBottom: '2rem' }}>
                <div className="card stat-card">
                  <div className="icon-box"><Users color="#6366f1"/></div>
                  <div>
                    <p className="stat-label">Total Suppliers</p>
                    <h3>{suppliers.length}</h3>
                  </div>
                </div>
                <div className="card stat-card">
                  <div className="icon-box"><CreditCard color="#10b981"/></div>
                  <div>
                    <p className="stat-label">With Credit</p>
                    <h3>{suppliers.filter(s => s.hasCredit).length}</h3>
                  </div>
                </div>
                <div className="card stat-card">
                  <div className="icon-box"><Truck color="#f59e0b"/></div>
                  <div>
                    <p className="stat-label">Main Categories</p>
                    <h3>{[...new Set(suppliers.map(s => s.category))].length}</h3>
                  </div>
                </div>
              </div>

              {/* Supplier List */}
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Supplier Name</th>
                      <th>Category</th>
                      <th>MOQ (MXN)</th>
                      <th>Credit</th>
                      <th>Rating</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map(s => (
                      <tr key={s.id} onClick={() => { setActiveSupplier(s); setView('details'); }} style={{ cursor: 'pointer' }}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.contactName}</div>
                        </td>
                        <td><span className="badge">{s.category}</span></td>
                        <td style={{ fontWeight: 700 }}>${parseFloat(s.moq).toLocaleString()}</td>
                        <td>
                          {s.hasCredit ? 
                            <span className="badge badge-success">YES</span> : 
                            <span className="badge" style={{ background: '#f1f5f9' }}>NO</span>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < s.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                            ))}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.dateAdded}</td>
                        <td>
                          <button className="icon-btn"><MoreVertical size={18}/></button>
                        </td>
                      </tr>
                    ))}
                    {filteredSuppliers.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No suppliers found. Add your first one!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {view === 'form' && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card"
              style={{ maxWidth: '800px', margin: '0 auto' }}
            >
              <div style={{ marginBottom: '2rem' }}>
                <button className="btn btn-outline" onClick={() => setView('dashboard')} style={{ marginBottom: '1rem' }}>
                  <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }}/> Back
                </button>
                <h2>New Supplier Scorecard</h2>
                <p style={{ color: 'var(--text-muted)' }}>Define conditions and credit terms for comparison.</p>
              </div>

              <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group">
                  <label>Supplier Name</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. FerreAbasto" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" required value={formData.category} onChange={handleInputChange}>
                    <option value="">Select Category</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Tools">Tools</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Construction">Construction</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>MOQ (Pesos)</label>
                  <input type="number" name="moq" required value={formData.moq} onChange={handleInputChange} placeholder="5000" />
                </div>
                <div className="form-group">
                  <label>Delivery Time (Days)</label>
                  <input type="text" name="deliveryTime" value={formData.deliveryTime} onChange={handleInputChange} placeholder="3-5 days" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="hasCredit" checked={formData.hasCredit} onChange={handleInputChange} />
                    Available Credit Line
                  </label>
                </div>
                {formData.hasCredit && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Credit Terms</label>
                    <input type="text" name="creditTerms" value={formData.creditTerms} onChange={handleInputChange} placeholder="30 days, 15% discount on prompt pay..." />
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Product Lines</label>
                  <textarea name="productLines" value={formData.productLines} onChange={handleInputChange} placeholder="PVC, Copper, Specialized fittings..." rows="3"></textarea>
                </div>
                <div className="form-group">
                  <label>Contact Name</label>
                  <input type="text" name="contactName" value={formData.contactName} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Rating (1-5)</label>
                  <input type="number" min="1" max="5" name="rating" value={formData.rating} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Special Conditions / Notes</label>
                  <textarea name="specialConditions" value={formData.specialConditions} onChange={handleInputChange} rows="2"></textarea>
                </div>
                
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Scorecard</button>
                  <button type="button" className="btn btn-outline" onClick={() => setView('dashboard')}>Cancel</button>
                </div>
              </form>
            </motion.div>
          )}

          {view === 'details' && activeSupplier && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="details-container"
            >
              <div className="section-title no-print">
                <button className="btn btn-outline" onClick={() => setView('dashboard')}>
                  <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }}/> Dashboard
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={() => window.print()}><Printer size={18}/> Print</button>
                  <button className="btn btn-outline" onClick={() => exportToPDF(activeSupplier)}><Download size={18}/> PDF</button>
                  <button className="btn btn-primary" onClick={() => setView('compare')}><BarChart2 size={18}/> Compare</button>
                </div>
              </div>

              <div className="scorecard-view card">
                <div className="scorecard-header">
                  <div>
                    <h1>{activeSupplier.name}</h1>
                    <span className="badge badge-category">{activeSupplier.category}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Supplier ID: #{activeSupplier.id.toString().slice(-6)}</p>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={20} fill={i < activeSupplier.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="scorecard-body">
                  <div className="scorecard-section">
                    <h3>Financial Conditions</h3>
                    <div className="detail-item">
                      <span>Minimum Order (MOQ)</span>
                      <strong>${parseFloat(activeSupplier.moq).toLocaleString()} MXN</strong>
                    </div>
                    <div className="detail-item">
                      <span>Credit Availability</span>
                      <strong>{activeSupplier.hasCredit ? 'ENABLED' : 'NONE'}</strong>
                    </div>
                    {activeSupplier.hasCredit && (
                      <div className="detail-item">
                        <span>Terms</span>
                        <strong>{activeSupplier.creditTerms}</strong>
                      </div>
                    )}
                  </div>

                  <div className="scorecard-section">
                    <h3>Operations</h3>
                    <div className="detail-item">
                      <span>Average Lead Time</span>
                      <strong>{activeSupplier.deliveryTime || 'Not specified'}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Product Coverage</span>
                      <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>{activeSupplier.productLines}</p>
                    </div>
                  </div>

                  <div className="scorecard-section">
                    <h3>Contact Info</h3>
                    <div className="detail-item">
                      <span>Representative</span>
                      <strong>{activeSupplier.contactName}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Email</span>
                      <strong>{activeSupplier.email}</strong>
                    </div>
                  </div>
                </div>
                
                {activeSupplier.specialConditions && (
                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid var(--accent)' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Special Notes</h4>
                    <p>{activeSupplier.specialConditions}</p>
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
              <div className="section-title">
                <h2>Cross-Supplier Comparison</h2>
                <button className="btn btn-primary" onClick={exportToExcel}><Download size={18}/> Export Matrix</button>
              </div>

              <div className="card overflow-x">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th className="sticky-col">Supplier</th>
                      <th>Category</th>
                      <th>MOQ (MXN)</th>
                      <th>Credit</th>
                      <th>Lead Time</th>
                      <th>Product Scope</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id}>
                        <td className="sticky-col" style={{ fontWeight: 700 }}>{s.name}</td>
                        <td>{s.category}</td>
                        <td style={{ color: s.moq > 10000 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                          ${parseFloat(s.moq).toLocaleString()}
                        </td>
                        <td>{s.hasCredit ? 'Yes' : 'No'}</td>
                        <td>{s.deliveryTime}</td>
                        <td style={{ maxWidth: '200px', fontSize: '0.875rem' }}>{s.productLines}</td>
                        <td>
                          <div className="score-badge" style={{ background: s.rating >= 4 ? '#d1fae5' : '#fee2e2' }}>
                            {s.rating}/5
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

      <style>{`
        .btn-sidebar {
          width: 100%;
          justify_content: flex-start;
          color: rgba(255,255,255,0.7);
          padding: 0.875rem 1rem;
          border-radius: 12px;
        }
        .btn-sidebar:hover { background: rgba(255,255,255,0.1); color: white; }
        .btn-sidebar.active { background: var(--accent); color: white; }
        
        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 1rem;
          outline: none;
          box-shadow: var(--shadow);
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .icon-box {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-label { font-size: 0.875rem; color: var(--text-muted); }
        
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; }
        .data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
        .data-table tr:hover { background: #f8fafc; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.875rem; font-weight: 600; color: var(--text-muted); }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          font-family: inherit;
        }
        
        .scorecard-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 2rem; border-bottom: 1px solid var(--border); margin-bottom: 2rem; }
        .scorecard-body { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 3rem; }
        .scorecard-section h3 { font-size: 1rem; margin-bottom: 1.5rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .detail-item { margin-bottom: 1rem; }
        .detail-item span { display: block; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem; }
        
        .overflow-x { overflow-x: auto; }
        .comparison-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .comparison-table th, .comparison-table td { padding: 1rem; border-bottom: 1px solid var(--border); text-align: left; }
        .sticky-col { position: sticky; left: 0; background: white; z-index: 10; border-right: 2px solid var(--border); }
        
        .score-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 8px; font-weight: 700; }
        
        @media print {
          .app-container { display: block; }
          .main-content { margin-left: 0; padding: 0; }
          .card { border: none; box-shadow: none; }
        }
      `}</style>
    </div>
  );
};

export default App;
