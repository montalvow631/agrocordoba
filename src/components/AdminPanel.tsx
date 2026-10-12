import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  Package, 
  Users, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  FileText, 
  MessageCircle, 
  ArrowLeft, 
  MapPin, 
  Building,
  DollarSign
} from 'lucide-react';
import { Product, QuotationRequest, ProductCategory, UserProfile } from '../types';
import { MUNICIPALITIES } from '../data/mockData';
import { formatCop, formatUsd } from '../utils/formatters';

interface AdminPanelProps {
  products: Product[];
  quotations: QuotationRequest[];
  onUpdateProduct: (product: Product) => Promise<void> | void;
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void> | void;
  onDeleteProduct: (id: string) => Promise<void> | void;
  onExit: () => void;
  currency: 'COP' | 'USD';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  quotations,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onExit,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'quotations' | 'associations' | 'clients' | 'producers'>('overview');
  const [searchFilter, setSearchFilter] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('agrocordoba_registered_users');
      return saved ? (JSON.parse(saved) as UserProfile[]) : [];
    } catch (error) {
      console.error('No se pudieron leer las cuentas registradas:', error);
      return [];
    }
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProducerId, setNewProducerId] = useState('');
  const [productFormError, setProductFormError] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [backendUsersLoaded, setBackendUsersLoaded] = useState(false);
  const [adminApiMessage, setAdminApiMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/users', { credentials: 'include' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudieron cargar las cuentas del servidor.');
        return payload as { users: UserProfile[] };
      })
      .then(({ users }) => {
        if (!active) return;
        setRegisteredUsers(users);
        setBackendUsersLoaded(true);
        setAdminApiMessage('Cuentas conectadas a la base de datos.');
      })
      .catch((error: Error) => {
        if (active) setAdminApiMessage(`${error.message} Este acceso de demostración solo cambia datos locales.`);
      });
    return () => { active = false; };
  }, []);

  // Quick Inline Editing State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceCop, setEditPriceCop] = useState<number>(0);
  const [editStockKg, setEditStockKg] = useState<number>(0);

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newVariety, setNewVariety] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Tubérculos y Raíces');
  const [newMunicipalityId, setNewMunicipalityId] = useState('cerete');
  const [newPriceCopKg, setNewPriceCopKg] = useState<number>(2500);
  const [newStockKg, setNewStockKg] = useState<number>(5000);
  const [newMinOrderKg, setNewMinOrderKg] = useState<number>(200);
  const [newImage, setNewImage] = useState(
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80'
  );
  const [newDescription, setNewDescription] = useState('');
  const [newPackaging, setNewPackaging] = useState('Sacos de 50 kg ventilados');

  const startEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditPriceCop(prod.priceCopKg);
    setEditStockKg(prod.stockAvailableKg);
  };

  const activeProducers = registeredUsers.filter((user) => user.role === 'productor' && user.status === 'activo');
  const selectedProducer = activeProducers.find((user) => user.id === newProducerId);

  useEffect(() => {
    if (!activeProducers.some((user) => user.id === newProducerId)) {
      setNewProducerId(activeProducers[0]?.id || '');
    }
  }, [registeredUsers, newProducerId]);

  const saveEditProduct = async (prod: Product) => {
    try {
      await onUpdateProduct({
        ...prod,
        priceCopKg: editPriceCop,
        priceUsdKg: Number((editPriceCop / 4150).toFixed(2)),
        stockAvailableKg: editStockKg,
      });
      setEditingProductId(null);
    } catch (error) {
      window.alert((error as Error).message || 'No se pudieron guardar los cambios.');
    }
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');
    if (!selectedProducer) {
      setProductFormError('Aprueba una cuenta de productor antes de publicar una cosecha.');
      return;
    }
    const muni = MUNICIPALITIES.find((m) => m.id === newMunicipalityId);
    setSavingProduct(true);
    try {
      await onAddProduct({
        producerId: selectedProducer.id,
        name: newName,
        variety: newVariety || 'Variedad Regional',
        category: newCategory,
        municipalityId: newMunicipalityId,
        municipalityName: muni ? muni.name : 'Córdoba',
        producerName: selectedProducer.name,
        producerAssociation: selectedProducer.association || 'Independiente',
        producerPhoto: selectedProducer.avatar || '',
        producerWhatsapp: selectedProducer.phone || '',
        producerExperienceYears: 0,
        image: newImage,
        priceCopKg: newPriceCopKg,
        priceUsdKg: Number((newPriceCopKg / 4150).toFixed(2)),
        stockAvailableKg: newStockKg,
        stockMinKg: Math.max(1, Math.round(newStockKg * 0.1)),
        minOrderKg: newMinOrderKg,
        lat: muni ? muni.lat : 8.74,
        lng: muni ? muni.lng : -75.88,
        harvestSeason: 'Cosecha del mes activa',
        certifications: [],
        packaging: newPackaging,
        description: newDescription,
        featured: false,
      });
      setShowAddModal(false);
      setNewName('');
      setNewVariety('');
    } catch (error) {
      setProductFormError((error as Error).message || 'No se pudo publicar la cosecha.');
    } finally {
      setSavingProduct(false);
    }
  };

  const clientCount = registeredUsers.filter((user) => user.role === 'cliente').length;
  const producerCount = registeredUsers.filter((user) => user.role === 'productor').length;
  const visibleUsers = registeredUsers.filter((user) => {
    const expectedRole = activeTab === 'clients' ? 'cliente' : 'productor';
    if (user.role !== expectedRole) return false;
    const query = searchFilter.trim().toLocaleLowerCase();
    const matchesSearch = !query || [user.name, user.email, user.city, user.farmName, user.association, user.businessType]
      .some((value) => value?.toLocaleLowerCase().includes(query));
    return matchesSearch;
  });
  const getProducerProducts = (user: UserProfile) => Array.from(new Set([
    ...(user.products || []),
    ...products.filter((product) => product.producerName.trim().toLocaleLowerCase() === user.name.trim().toLocaleLowerCase()).map((product) => product.name),
  ]));

  const saveRegisteredUsers = (nextUsers: UserProfile[]) => {
    try {
      localStorage.setItem('agrocordoba_registered_users', JSON.stringify(nextUsers));
      setRegisteredUsers(nextUsers);
    } catch (error) {
      console.error('No se pudieron guardar los cambios de las cuentas:', error);
      window.alert('No se pudo guardar el cambio en este navegador.');
    }
  };

  const saveEditedUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;
    if (backendUsersLoaded) {
      try {
        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingUser),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo guardar la cuenta.');
        setRegisteredUsers((users) => users.map((user) => user.id === editingUser.id ? payload.user as UserProfile : user));
        setEditingUser(null);
      } catch (error) {
        window.alert((error as Error).message);
      }
      return;
    }
    saveRegisteredUsers(registeredUsers.map((user) => user.id === editingUser.id ? editingUser : user));
    setEditingUser(null);
  };

  const updateStatusInBackend = async (userId: string, status: NonNullable<UserProfile['status']>) => {
    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'No se pudo actualizar la cuenta.');
    setRegisteredUsers((users) => users.map((item) => item.id === userId ? payload.user as UserProfile : item));
  };

  const toggleUserStatus = async (user: UserProfile) => {
    const nextStatus = user.status === 'pendiente' || user.status === 'inactivo' ? 'activo' : 'inactivo';
    await setAccountStatus(user, nextStatus);
  };

  const setAccountStatus = async (user: UserProfile, nextStatus: NonNullable<UserProfile['status']>) => {
    if (backendUsersLoaded) {
      try {
        await updateStatusInBackend(user.id, nextStatus);
      } catch (error) {
        window.alert((error as Error).message);
      }
      return;
    }
    saveRegisteredUsers(registeredUsers.map((item) => item.id === user.id ? { ...item, status: nextStatus } : item));
  };

  const deleteUser = async (user: UserProfile) => {
    const kind = user.role === 'productor' ? 'productor' : 'cliente';
    if (!window.confirm(`¿Eliminar la cuenta de ${kind} de ${user.name}? Esta acción no se puede deshacer.`)) return;
    if (backendUsersLoaded) {
      try {
        const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE', credentials: 'include' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudo eliminar la cuenta.');
        setRegisteredUsers((users) => users.filter((item) => item.id !== user.id));
      } catch (error) {
        window.alert((error as Error).message);
      }
      return;
    }
    saveRegisteredUsers(registeredUsers.filter((item) => item.id !== user.id));
  };

  return (
    <div className="min-h-screen bg-[#f7fdf8] pb-16">
      {/* Top Admin Banner */}
      <div className="bg-[#002819] border-b border-[#134e35] text-white">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la Tienda</span>
            </button>
            <div className="h-6 w-px bg-white/20"></div>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h1 className="font-display font-bold text-lg text-white">
                  Panel de administración AgroCórdoba
                </h1>
              </div>
              <p className="text-xs text-[#b4f0cd]">
                Resumen, cuentas, cosechas y solicitudes de cotización
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(activeTab === 'overview' || activeTab === 'products') && <button
              id="btn-admin-add-product"
              onClick={() => setShowAddModal(true)}
              className="bg-[#9b4500] hover:bg-[#b85200] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agregar producto</span>
            </button>}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="container mx-auto px-4 mt-6">
        {activeTab === 'overview' && <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#c0c9c1]/60 shadow-xs">
            <span className="text-xs font-semibold text-[#707972] block">Productos publicados</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-display font-bold text-[#003622]">
                {products.length}
              </span>
              <Package className="w-5 h-5 text-[#134e35]" />
            </div>
            <span className="text-[11px] text-[#707972] mt-1 block">Disponibles en el catálogo</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#c0c9c1]/60 shadow-xs">
            <span className="text-xs font-semibold text-[#707972] block">Cotizaciones recibidas</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-display font-bold text-[#9b4500]">
                {quotations.length}
              </span>
              <FileText className="w-5 h-5 text-[#9b4500]" />
            </div>
            <span className="text-[11px] text-[#707972] mt-1 block">
              {quotations.filter((q) => q.status === 'Pendiente').length} pendientes de seguimiento
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#c0c9c1]/60 shadow-xs">
            <span className="text-xs font-semibold text-[#707972] block">Clientes registrados</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-display font-bold text-[#003622]">{clientCount}</span>
              <Users className="w-5 h-5 text-[#134e35]" />
            </div>
            <span className="text-[11px] text-[#707972] mt-1 block">Cuentas registradas aquí</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#c0c9c1]/60 shadow-xs">
            <span className="text-xs font-semibold text-[#707972] block">Productores registrados</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-display font-bold text-[#003622]">{producerCount}</span>
              <Package className="w-5 h-5 text-[#9b4500]" />
            </div>
            <span className="text-[11px] text-[#707972] mt-1 block">Cuentas registradas aquí</span>
          </div>
        </div>

        </>}

        {/* Tab Navigation */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-[#c0c9c1]/50 pb-2">
          <button onClick={() => { setActiveTab('overview'); setSearchFilter(''); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'overview' ? 'bg-[#003622] text-[#b4f0cd]' : 'text-[#404943] hover:bg-white'}`}>
            Inicio
          </button>
          <button
            onClick={() => { setActiveTab('products'); setSearchFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'bg-[#003622] text-[#b4f0cd]'
                : 'text-[#404943] hover:bg-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Gestión de Cosechas ({products.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('quotations'); setSearchFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'quotations'
                ? 'bg-[#003622] text-[#b4f0cd]'
                : 'text-[#404943] hover:bg-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Solicitudes Entrantes ({quotations.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('associations'); setSearchFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'associations'
                ? 'bg-[#003622] text-[#b4f0cd]'
                : 'text-[#404943] hover:bg-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Directorio de Asociaciones</span>
          </button>
          <button onClick={() => { setActiveTab('clients'); setSearchFilter(''); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'clients' ? 'bg-[#003622] text-[#b4f0cd]' : 'text-[#404943] hover:bg-white'}`}>
            <Users className="w-4 h-4" /><span>Clientes ({clientCount})</span>
          </button>
          <button onClick={() => { setActiveTab('producers'); setSearchFilter(''); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'producers' ? 'bg-[#003622] text-[#b4f0cd]' : 'text-[#404943] hover:bg-white'}`}>
            <Package className="w-4 h-4" /><span>Productores ({producerCount})</span>
          </button>
        </div>

        {activeTab === 'overview' && (
          <section className="mt-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9b4500]">Administración</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#173b2b]">¿Qué necesitas revisar?</h2>
              <p className="mt-1 text-sm text-[#59645e]">Elige una sección. Cada opción tiene una tarea distinta.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                { title: 'Clientes', count: clientCount, description: 'Ver sus datos, editar el perfil, desactivar o eliminar la cuenta.', tab: 'clients' as const, action: 'Administrar clientes' },
                { title: 'Productores', count: producerCount, description: 'Ver fincas, asociaciones, productos y administrar sus cuentas.', tab: 'producers' as const, action: 'Administrar productores' },
                { title: 'Productos', count: products.length, description: 'Revisar cosechas publicadas, cambiar precio o cantidad y retirar publicaciones.', tab: 'products' as const, action: 'Gestionar productos' },
                { title: 'Cotizaciones', count: quotations.length, description: 'Consultar las solicitudes de compra y actualizar su seguimiento.', tab: 'quotations' as const, action: 'Ver cotizaciones' },
                { title: 'Asociaciones', count: null, description: 'Consultar el directorio y los datos de las organizaciones.', tab: 'associations' as const, action: 'Ver asociaciones' },
              ].map((item) => (
                <article key={item.title} className="flex min-h-48 flex-col rounded-2xl border border-[#d8dfd2] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-[#173b2b]">{item.title}</h3>
                    {item.count !== null && <span className="rounded-full bg-[#eaf3e9] px-3 py-1 text-sm font-bold text-[#176044]">{item.count}</span>}
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[#59645e]">{item.description}</p>
                  <button onClick={() => { setActiveTab(item.tab); setSearchFilter(''); }} className="mt-4 self-start rounded-xl bg-[#07503f] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#003622]">{item.action} →</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* TAB 1: Products Table */}
        {activeTab === 'products' && (
          <div className="mt-6 bg-white rounded-2xl border border-[#c0c9c1]/60 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#c0c9c1]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#707972] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cosecha, productor o municipio..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#c0c9c1] text-xs focus:outline-none focus:ring-2 focus:ring-[#003622]"
                />
              </div>

              <div className="text-xs text-[#707972]">
                Haga clic en <Edit3 className="w-3 h-3 inline text-[#003622]" /> para ajustar stock y precio en vivo
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7fdf8] text-[#707972] font-bold uppercase tracking-wider border-b border-[#c0c9c1]/40">
                  <tr>
                    <th className="py-3 px-4">Cultivo & Variedad</th>
                    <th className="py-3 px-4">Municipio</th>
                    <th className="py-3 px-4">Campesino / Asociación</th>
                    <th className="py-3 px-4">Precio COP/kg</th>
                    <th className="py-3 px-4">Stock (kg)</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c0c9c1]/30">
                  {products
                    .filter((p) => {
                      const q = searchFilter.toLowerCase();
                      return (
                        !q ||
                        p.name.toLowerCase().includes(q) ||
                        p.variety.toLowerCase().includes(q) ||
                        p.producerName.toLowerCase().includes(q) ||
                        p.municipalityName.toLowerCase().includes(q)
                      );
                    })
                    .map((prod) => {
                      const isEditing = editingProductId === prod.id;
                      return (
                        <tr key={prod.id} className="hover:bg-[#f7fdf8]/80 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-9 h-9 rounded-lg object-cover border border-[#c0c9c1]"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="font-bold text-[#151d19] block">
                                  {prod.name}
                                </span>
                                <span className="text-[11px] text-[#9b4500]">
                                  {prod.variety} • {prod.category}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-semibold text-[#003622]">
                            {prod.municipalityName}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-medium text-[#151d19] block">
                              {prod.producerName}
                            </span>
                            <span className="text-[11px] text-[#707972]">
                              {prod.producerAssociation}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editPriceCop}
                                onChange={(e) => setEditPriceCop(Number(e.target.value))}
                                className="w-24 px-2 py-1 rounded border border-[#003622] text-xs font-bold"
                              />
                            ) : (
                              <div>
                                <span className="font-bold text-[#003622] block">
                                  {formatCop(prod.priceCopKg)}
                                </span>
                                <span className="text-[10px] text-[#707972]">
                                  {formatUsd(prod.priceUsdKg)} USD
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editStockKg}
                                onChange={(e) => setEditStockKg(Number(e.target.value))}
                                className="w-24 px-2 py-1 rounded border border-[#003622] text-xs font-bold"
                              />
                            ) : (
                              <span className="font-semibold text-[#151d19]">
                                {prod.stockAvailableKg.toLocaleString('es-CO')} kg
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => void saveEditProduct(prod)}
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                  title="Guardar cambios"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingProductId(null)}
                                  className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                                  title="Cancelar"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                {prod.producerId ? <>
                                  <button
                                    onClick={() => startEditProduct(prod)}
                                    className="p-1.5 rounded-lg text-[#003622] hover:bg-[#eef8f1] transition"
                                    title="Editar precio y stock"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => void Promise.resolve(onDeleteProduct(prod.id)).catch((error: Error) => window.alert(error.message || 'No se pudo eliminar la publicación.'))}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                                    title="Eliminar publicación"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </> : <span className="text-[11px] text-[#707972]">Referencia</span>}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Quotations Table */}
        {activeTab === 'quotations' && (
          <div className="mt-6 bg-white rounded-2xl border border-[#c0c9c1]/60 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#c0c9c1]/40 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#151d19]">
                Bandeja de Solicitudes y Cotizaciones Entrantes
              </h3>
              <span className="text-xs text-[#707972]">
                Total: {quotations.length} cotizaciones
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7fdf8] text-[#707972] font-bold uppercase tracking-wider border-b border-[#c0c9c1]/40">
                  <tr>
                    <th className="py-3 px-4">ID & Fecha</th>
                    <th className="py-3 px-4">Cosecha Requerida</th>
                    <th className="py-3 px-4">Comprador & Negocio</th>
                    <th className="py-3 px-4">Cantidad</th>
                    <th className="py-3 px-4">Destino</th>
                    <th className="py-3 px-4">Total Liquidado</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c0c9c1]/30">
                  {quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-[#f7fdf8]/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#151d19] block">
                          {q.id}
                        </span>
                        <span className="text-[10px] text-[#707972]">
                          {q.createdAt}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[#003622] block">
                          {q.productName}
                        </span>
                        <span className="text-[11px] text-[#707972]">
                          Productor: {q.producerName}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[#151d19] block">
                          {q.clientName}
                        </span>
                        <span className="text-[11px] text-[#9b4500] font-semibold block">
                          {q.clientBusinessType} • {q.clientCity}
                        </span>
                        <span className="text-[10px] text-[#707972]">
                          {q.clientPhone}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-[#151d19]">
                        {q.quantityKg.toLocaleString('es-CO')} kg
                      </td>

                      <td className="py-3 px-4 text-[#404943]">
                        {q.destinationZone}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[#003622] block">
                          {formatCop(q.totalCop)}
                        </span>
                        <span className="text-[10px] text-[#707972]">
                          {formatUsd(q.totalUsd)} USD
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${q.status === 'Pendiente' ? 'bg-amber-50 text-amber-800' : q.status === 'Cotizado' ? 'bg-sky-50 text-sky-800' : q.status === 'Cerrado' ? 'bg-emerald-50 text-emerald-800' : 'bg-[#e3f7ea] text-[#0f6b3a]'}`}>
                          {q.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <a
                          href={`https://wa.me/${q.producerWhatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-[#134e35] hover:bg-[#003622] text-[#b4f0cd] px-2.5 py-1 rounded-lg font-bold text-[11px] transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Contactar</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === 'clients' || activeTab === 'producers') && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-[#c0c9c1]/60 bg-white shadow-xs">
            <div className="flex flex-col gap-4 border-b border-[#c0c9c1]/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-[#003622]">{activeTab === 'clients' ? 'Gestión de clientes' : 'Gestión de productores'}</h2>
                <p className="mt-1 text-xs text-[#707972]">{activeTab === 'clients' ? 'Datos de contacto, municipio y tipo de negocio.' : 'Datos de contacto, finca, asociación y productos publicados.'}</p>
                <p className={`mt-1 text-xs font-medium ${backendUsersLoaded ? 'text-emerald-700' : 'text-amber-800'}`}>{adminApiMessage || 'Conectando con la base de datos...'}</p>
              </div>
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707972]" />
                  <input
                    value={searchFilter}
                    onChange={(event) => setSearchFilter(event.target.value)}
                    placeholder="Buscar nombre, correo o municipio"
                    className="w-full rounded-xl border border-[#c0c9c1] py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#003622] sm:w-64"
                  />
              </div>
            </div>

            {visibleUsers.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-xs">
                  <thead className="bg-[#f7fdf8] text-[10px] font-bold uppercase tracking-wider text-[#707972]">
                    <tr>
                      <th className="px-4 py-3">Persona / negocio</th>
                      <th className="px-4 py-3">Contacto</th>
                      <th className="px-4 py-3">Ubicación</th>
                      <th className="px-4 py-3">{activeTab === 'clients' ? 'Tipo de negocio' : 'Finca / asociación'}</th>
                      {activeTab === 'producers' && <th className="px-4 py-3">Productos declarados</th>}
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Registro</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9c1]/30">
                    {visibleUsers.map((user) => (
                      <tr key={user.id} className="align-top hover:bg-[#f7fdf8]/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar ? <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf3e9] font-bold text-[#176044]">{user.name.slice(0, 1).toUpperCase()}</span>}
                            <span className="font-semibold text-[#17231c]">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#404943]">
                          <span className="block">{user.email || 'Sin correo'}</span>
                          <span className="mt-1 block text-[#707972]">{user.phone || 'Sin teléfono'}</span>
                        </td>
                        <td className="px-4 py-3 text-[#404943]">{user.city || 'Sin municipio'}</td>
                        <td className="px-4 py-3 text-[#404943]">{activeTab === 'producers' ? (user.farmName || user.association || 'Sin finca o asociación') : (user.businessType || 'Sin tipo de negocio')}</td>
                        {activeTab === 'producers' && <td className="max-w-48 px-4 py-3 text-[#404943]">{getProducerProducts(user).length ? getProducerProducts(user).join(', ') : 'Sin cosechas vinculadas'}</td>}
                        <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 font-semibold ${user.status === 'inactivo' ? 'bg-red-50 text-red-700' : user.status === 'pendiente' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{user.status || 'activo'}</span></td>
                        <td className="px-4 py-3 text-[#707972]">{user.registeredAt ? new Date(user.registeredAt).toLocaleDateString('es-CO') : 'Sin fecha'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={() => setEditingUser({ ...user })} className="rounded-lg border border-[#c0c9c1] px-2 py-1.5 font-semibold text-[#134e35] hover:bg-[#f1f7f2]">Ver / editar</button>
                            {user.status === 'pendiente' && backendUsersLoaded && <button type="button" onClick={() => void setAccountStatus(user, 'inactivo')} className="rounded-lg border border-red-200 px-2 py-1.5 font-semibold text-red-700 hover:bg-red-50">Rechazar</button>}
                            <button type="button" onClick={() => void toggleUserStatus(user)} className="rounded-lg border border-[#c0c9c1] px-2 py-1.5 font-semibold text-[#8a4c12] hover:bg-[#fbf3e4]">{user.status === 'pendiente' ? 'Aprobar' : user.status === 'inactivo' ? 'Reactivar' : 'Desactivar'}</button>
                            <button type="button" onClick={() => void deleteUser(user)} className="rounded-lg border border-red-200 px-2 py-1.5 font-semibold text-red-700 hover:bg-red-50">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <Users className="mx-auto h-8 w-8 text-[#8b9b90]" />
                <h3 className="mt-3 font-semibold text-[#173b2b]">{registeredUsers.some((user) => user.role === (activeTab === 'clients' ? 'cliente' : 'productor')) ? 'No encontramos perfiles con esa búsqueda' : activeTab === 'clients' ? 'Aún no hay clientes registrados aquí' : 'Aún no hay productores registrados aquí'}</h3>
                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#707972]">Cuando se registre una cuenta de este tipo aparecerá aquí. Para gestionar usuarios desde varios dispositivos, esta sección debe conectarse a la API del backend.</p>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Associations Directory */}
        {activeTab === 'associations' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'ASOPROAGRO Cereté',
                muni: 'Cereté',
                farmers: 210,
                lead: 'Plátano Hartón, Maíz Amarillo Criollo',
                rep: 'Don Carmelo Doria',
                phone: '+57 310 452 9811',
              },
              {
                name: 'COOPTIERRALTA / ASOCAGRO',
                muni: 'Tierralta',
                farmers: 260,
                lead: 'Cacao Fino de Aroma, Café Serranía Paramillo',
                rep: 'Don Argemiro Ballesteros',
                phone: '+57 313 620 1844',
              },
              {
                name: 'ASOCANAS Sabanas',
                muni: 'Sahagún',
                farmers: 195,
                lead: 'Ñame Espino Selección, Miel Pura Silvestre',
                rep: 'Doña Luz Elena Paternina',
                phone: '+57 321 789 4520',
              },
              {
                name: 'Cooperativa COOPCASABE',
                muni: 'Ciénaga de Oro',
                farmers: 130,
                lead: 'Casabe Tradicional, Yuca Criolla Dulce',
                rep: 'Don Efraín Morelo Cogollo',
                phone: '+57 311 893 2410',
              },
              {
                name: 'ASOPROFRUT Bajo Sinú',
                muni: 'Lorica',
                farmers: 180,
                lead: 'Mango Tommy Atkins, Bocachico de Repoblación',
                rep: 'Doña Rosiris Conde Martelo',
                phone: '+57 320 491 0287',
              },
              {
                name: 'Productores Unidos del San Jorge',
                muni: 'Montelíbano',
                farmers: 170,
                lead: 'Arroz Paddy Verde, Papaya Hawaiana',
                rep: 'Doña Gladys Ramos Villalba',
                phone: '+57 315 998 2314',
              },
            ].map((assoc, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-[#c0c9c1]/60 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9b4500]">
                        Municipio: {assoc.muni}
                      </span>
                      <h4 className="font-display font-bold text-base text-[#003622] mt-0.5">
                        {assoc.name}
                      </h4>
                    </div>
                    <span className="bg-[#b4f0cd] text-[#003622] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {assoc.farmers} familias
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-[#404943]">
                    <strong>Cultivos Líderes:</strong> {assoc.lead}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#c0c9c1]/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#707972] block">Representante Legal:</span>
                    <span className="font-bold text-[#151d19]">{assoc.rep}</span>
                  </div>
                  <a
                    href={`https://wa.me/${assoc.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#eef8f1] hover:bg-[#b4f0cd] text-[#003622] transition"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to Publish New Harvest */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#c0c9c1] overflow-hidden my-6">
            <div className="bg-[#003622] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#b4f0cd]" />
                <h3 className="font-display font-bold text-base">
                  Publicar Nueva Cosecha Campesina
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#151d19] block mb-1">
                    Nombre del Producto:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Plátano Hartón Verde"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#151d19] block mb-1">
                    Variedad Específica:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Dominico Sinú"
                    value={newVariety}
                    onChange={(e) => setNewVariety(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#151d19] block mb-1">
                    Municipio de Origen (Córdoba):
                  </label>
                  <select
                    value={newMunicipalityId}
                    onChange={(e) => setNewMunicipalityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1] bg-white font-semibold"
                  >
                    {MUNICIPALITIES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.subregion})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#151d19] block mb-1">
                    Categoría:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1] bg-white font-semibold"
                  >
                    <option value="Tubérculos y Raíces">Tubérculos y Raíces</option>
                    <option value="Frutas Tropicales">Frutas Tropicales</option>
                    <option value="Cereales">Cereales</option>
                    <option value="Cacao y Café">Cacao y Café</option>
                    <option value="Agroindustria y Derivados">Agroindustria y Derivados</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#151d19] block mb-1">
                    Precio en Finca (COP/kg):
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={50}
                    value={newPriceCopKg}
                    onChange={(e) => setNewPriceCopKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1] font-bold text-[#003622]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#151d19] block mb-1">
                    Stock Disponible (kg):
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    step={100}
                    value={newStockKg}
                    onChange={(e) => setNewStockKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1] font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#151d19] block mb-1">
                    Pedido Mínimo (kg):
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={newMinOrderKg}
                    onChange={(e) => setNewMinOrderKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#151d19] block mb-1">Asignar al productor aprobado:</label>
                  <select
                    required
                    value={newProducerId}
                    onChange={(e) => setNewProducerId(e.target.value)}
                    disabled={!activeProducers.length}
                    className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1]"
                  >
                    <option value="">{activeProducers.length ? 'Selecciona un productor' : 'No hay productores aprobados'}</option>
                    {activeProducers.map((producer) => (
                      <option key={producer.id} value={producer.id}>{producer.name} · {producer.city}</option>
                    ))}
                  </select>
                  {selectedProducer && <p className="mt-1 text-[11px] text-[#707972]">{selectedProducer.association || 'Independiente'} · {selectedProducer.phone || 'Sin WhatsApp'}</p>}
                </div>
                <div>
                  <label className="font-bold text-[#151d19] block mb-1">
                    Tipo de Empaque:
                  </label>
                  <input
                    type="text"
                    value={newPackaging}
                    onChange={(e) => setNewPackaging(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#151d19] block mb-1">
                  URL de Imagen de la Cosecha:
                </label>
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1]"
                />
              </div>

              <div>
                <label className="font-bold text-[#151d19] block mb-1">
                  Descripción Técnica del Lote:
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de calibre, época de corte, método de cultivo..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c0c9c1]"
                />
              </div>

              {productFormError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{productFormError}</p>}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c0c9c1] font-semibold text-[#707972]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || !activeProducers.length}
                  className="px-5 py-2 rounded-xl bg-[#003622] hover:bg-[#134e35] text-white font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProduct ? 'Publicando…' : 'Publicar Cosecha en Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form onSubmit={saveEditedUser} className="my-6 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#003622] px-6 py-4 text-white">
              <div>
                <h2 className="font-display text-lg font-bold">Perfil de {editingUser.role === 'productor' ? 'productor' : 'cliente'}</h2>
                <p className="mt-1 text-xs text-white/75">Revisa la información y guarda los cambios que autorices.</p>
              </div>
              <button type="button" onClick={() => setEditingUser(null)} className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20" aria-label="Cerrar">Cerrar</button>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <label className="text-xs font-semibold text-[#404943]">Nombre completo
                <input required value={editingUser.name} onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })} className="mt-1 w-full rounded-xl border border-[#c0c9c1] px-3 py-2.5 text-sm font-normal text-[#17231c]" />
              </label>
              <label className="text-xs font-semibold text-[#404943]">Correo electrónico
                <input type="email" required value={editingUser.email} onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })} className="mt-1 w-full rounded-xl border border-[#c0c9c1] px-3 py-2.5 text-sm font-normal text-[#17231c]" />
              </label>
              <label className="text-xs font-semibold text-[#404943]">Teléfono
                <input value={editingUser.phone} onChange={(event) => setEditingUser({ ...editingUser, phone: event.target.value })} className="mt-1 w-full rounded-xl border border-[#c0c9c1] px-3 py-2.5 text-sm font-normal text-[#17231c]" />
              </label>
              <label className="text-xs font-semibold text-[#404943]">Municipio
                <input value={editingUser.city} onChange={(event) => setEditingUser({ ...editingUser, city: event.target.value })} className="mt-1 w-full rounded-xl border border-[#c0c9c1] px-3 py-2.5 text-sm font-normal text-[#17231c]" />
              </label>
              {editingUser.role === 'productor' ? <>
                <label className="text-xs font-semibold text-[#404943]">Finca
                  <input value={editingUser.farmName || ''} onChange={(event) => setEditingUser({ ...editingUser, farmName: event.target.value })} className="mt-1 w-full rounded-xl border border-[#c0c9c1] px-3 py-2.5 text-sm font-normal text-[#17231c]" />
                </label>
                <label className="text-xs font-semibold text-[#404943]">Asociación
                  <input value={editingUser.association || ''} onChange={(event) => setEditingUser({ ...editingUser, association: event.target.value })} className="mt-1 w-full rounded-xl border border-[#c0c9c1] px-3 py-2.5 text-sm font-normal text-[#17231c]" />
                </label>
                <label className="text-xs font-semibold text-[#404943] sm:col-span-2">Productos del productor (separados por comas)
                  <input value={editingUser.products?.join(', ') || ''} onChange={(event) => setEditingUser({ ...editingUser, products: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} className="mt-1 w-full rounded-xl border border-[#c0c9c1] px-3 py-2.5 text-sm font-normal text-[#17231c]" />
                </label>
              </> : <label className="text-xs font-semibold text-[#404943]">Tipo de negocio
                <select value={editingUser.businessType} onChange={(event) => setEditingUser({ ...editingUser, businessType: event.target.value as UserProfile['businessType'] })} className="mt-1 w-full rounded-xl border border-[#c0c9c1] bg-white px-3 py-2.5 text-sm font-normal text-[#17231c]">
                  <option value="Hogar">Hogar</option><option value="Restaurante">Restaurante</option><option value="Distribuidor">Distribuidor</option><option value="Importador">Importador</option>
                </select>
              </label>}
              <label className="text-xs font-semibold text-[#404943]">Estado de la cuenta
                <select value={editingUser.status || 'activo'} onChange={(event) => setEditingUser({ ...editingUser, status: event.target.value as UserProfile['status'] })} className="mt-1 w-full rounded-xl border border-[#c0c9c1] bg-white px-3 py-2.5 text-sm font-normal text-[#17231c]">
                  <option value="activo">Activa</option><option value="pendiente">Pendiente</option><option value="inactivo">Inactiva</option>
                </select>
              </label>
              <div className="text-xs text-[#707972]">Cuenta creada: {editingUser.registeredAt ? new Date(editingUser.registeredAt).toLocaleDateString('es-CO') : 'Sin fecha'}</div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e4dfd2] px-6 py-4">
              <button type="button" onClick={() => setEditingUser(null)} className="rounded-xl border border-[#c0c9c1] px-4 py-2 text-sm font-semibold text-[#404943]">Cancelar</button>
              <button type="submit" className="rounded-xl bg-[#07503f] px-5 py-2 text-sm font-bold text-white hover:bg-[#003622]">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
