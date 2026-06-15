import React, { useState, useMemo } from 'react';
import { 
  User, 
  Shield as ShieldIcon, 
  MoreVertical, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  Calendar,
  Clock,
  MessageSquare,
  BookOpen,
  ShoppingBag
} from 'lucide-react';
import Modal from './Modal';
import { getAllUsers, updateUser, deleteUser } from '../../services/dataService';
import { toast } from 'sonner';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  photo?: string;
  created_at: string;
  // UI extended properties
  status?: 'Active' | 'Suspended';
  membership?: 'Premium' | 'Regular';
  lastActive?: string;
  consultations?: number;
  lastArticle?: string;
  lastProduct?: string;
}

interface UserTableProps {
  isDarkMode?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({ isDarkMode = true }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete' | 'detail'>('add');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const [users, setUsers] = useState<UserData[]>([]);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      // Map PHP fields to local UI format
      const mapped = data.map((u: any) => ({
        ...u,
        status: 'Active',
        membership: u.role === 'admin' ? 'Premium' : 'Regular',
        lastActive: 'Baru saja',
        consultations: 0,
        lastArticle: '-',
        lastProduct: '-'
      }));
      setUsers(mapped);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Gagal mengambil data pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState<Partial<UserData>>({
    name: '',
    email: '',
    role: 'user',
    membership: 'Regular',
    status: 'Active'
  });

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterType === 'All') return matchesSearch;
      if (filterType === 'active') return matchesSearch && user.status === 'Active';
      if (filterType === 'suspended') return matchesSearch && user.status === 'Suspended';
      if (filterType === 'premium') return matchesSearch && user.membership === 'Premium';
      if (filterType === 'regular') return matchesSearch && user.membership === 'Regular';
      if (filterType === 'admin') return matchesSearch && user.role === 'admin';
      if (filterType === 'user') return matchesSearch && user.role === 'user';
      
      return matchesSearch;
    });
  }, [users, searchQuery, filterType]);

  const handleOpenModal = (type: 'add' | 'edit' | 'delete' | 'detail', user: UserData | null = null) => {
    setModalType(type);
    setSelectedUser(user);
    if (type === 'edit' && user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        membership: user.membership,
        status: user.status
      });
    } else if (type === 'add') {
      setFormData({
        name: '',
        email: '',
        role: 'user',
        membership: 'Regular',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (modalType === 'add') {
        toast.info('Gunakan form registrasi untuk user baru');
      } else if (modalType === 'edit' && selectedUser) {
        await updateUser({ ...formData, id: selectedUser.id });
        toast.success('Pengguna berhasil diperbarui');
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan data');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (selectedUser) {
      try {
        await deleteUser(selectedUser.id);
        toast.success('Pengguna berhasil dihapus');
        fetchUsers();
      } catch (err) {
        console.error(err);
        toast.error('Gagal menghapus pengguna');
      }
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (user: UserData) => {
    setUsers(users.map(u => 
      u.id === user.id 
        ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } 
        : u
    ));
  };

  return (
    <>
      <div className={`border rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-5 lg:p-6 shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-[#111814] border-white/5 shadow-black/40' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/20'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-5 mb-5 md:mb-6">
          <div className="min-w-0">
            <h3 className={`font-serif font-black text-lg md:text-xl lg:text-2xl mb-0.5 md:mb-1 truncate transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Manajemen Pengguna</h3>
            <p className={`text-[10px] md:text-[11px] font-medium transition-colors line-clamp-1 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Kelola akses, membership, dan aktivitas pengguna CRM.</p>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 md:gap-3">
            {/* Search */}
            <div className={`border rounded-xl md:rounded-2xl px-3 py-1.5 md:py-2 flex items-center gap-2 md:gap-3 transition-all flex-1 min-w-0 sm:min-w-[240px] ${isDarkMode ? 'bg-white/5 border-white/10 focus-within:border-brand-accent/50 shadow-inner' : 'bg-gray-50 border-gray-100 focus-within:border-brand-primary/50 shadow-sm'}`}>
              <Search className={`w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0 transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`} />
              <input 
                type="text" 
                placeholder="Cari nama atau email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-transparent text-[10px] md:text-[11px] font-semibold outline-none w-full min-w-0 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900 placeholder:text-gray-400'}`} 
              />
            </div>

            {/* Filter + Add Button container */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Filter */}
              <div className={`border rounded-xl md:rounded-2xl px-2 py-1.5 md:py-2 flex items-center gap-1.5 md:gap-2 transition-all flex-1 sm:flex-initial ${isDarkMode ? 'bg-white/5 border-white/10 shadow-inner' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                <Filter className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`} />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`bg-transparent text-[8px] md:text-[9px] font-black uppercase tracking-widest outline-none pr-1 md:pr-2 cursor-pointer w-full sm:w-auto transition-colors ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
                >
                  <option value="All" className={isDarkMode ? 'bg-[#111814] text-white' : 'bg-white text-gray-900'}>Semua</option>
                  <optgroup label="Status" className={isDarkMode ? 'bg-[#111814] text-white/50' : 'bg-white text-gray-500'}>
                    <option value="active" className={isDarkMode ? 'bg-[#111814] text-white' : 'bg-white text-gray-900'}>Aktif</option>
                    <option value="suspended" className={isDarkMode ? 'bg-[#111814] text-white' : 'bg-white text-gray-900'}>Suspended</option>
                  </optgroup>
                  <optgroup label="Membership" className={isDarkMode ? 'bg-[#111814] text-white/50' : 'bg-white text-gray-500'}>
                    <option value="premium" className={isDarkMode ? 'bg-[#111814] text-white' : 'bg-white text-gray-900'}>Premium</option>
                    <option value="regular" className={isDarkMode ? 'bg-[#111814] text-white' : 'bg-white text-gray-900'}>Regular</option>
                  </optgroup>
                  <optgroup label="Role" className={isDarkMode ? 'bg-[#111814] text-white/50' : 'bg-white text-gray-500'}>
                    <option value="admin" className={isDarkMode ? 'bg-[#111814] text-white' : 'bg-white text-gray-900'}>Admin</option>
                    <option value="user" className={isDarkMode ? 'bg-[#111814] text-white' : 'bg-white text-gray-900'}>User</option>
                  </optgroup>
                </select>
              </div>

              <button 
                type="button"
                onClick={() => handleOpenModal('add')}
                className={`flex items-center justify-center gap-1.5 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-accent/10 active:scale-95 flex-shrink-0 ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight' : 'bg-brand-primary text-white hover:opacity-95'}`}
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden xs:inline">Tambah</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className={`border-b transition-colors ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                <th className={`pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest pl-4 transition-colors ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>User</th>
                <th className={`pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Role</th>
                <th className={`pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Membership</th>
                <th className={`pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Status</th>
                <th className={`pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Joined</th>
                <th className={`pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Last Active</th>
                <th className={`pb-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-right pr-4 transition-colors ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors ${isDarkMode ? 'divide-white/5' : 'divide-gray-50'}`}>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`group transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50/50'}`}>
                  <td className="py-3 md:py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${isDarkMode ? 'bg-gradient-to-br from-brand-accent/20 to-brand-primary/20 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary shadow-sm'}`}>
                        <User className="w-4 h-4 md:w-4.5 md:h-4.5" />
                      </div>
                      <div>
                        <p className={`text-xs md:text-sm font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                        <p className={`text-[9px] md:text-[10px] font-medium transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 md:py-4">
                    <span className={`px-2.5 py-0.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-transparent ${
                      user.role === 'admin' ? (isDarkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-100 shadow-sm') : 
                      (isDarkMode ? 'bg-white/5 text-white/40 border-white/5' : 'bg-gray-100 text-gray-500 border-gray-200 shadow-sm')
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 md:py-4">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <ShieldIcon className={`w-3 md:w-3.5 h-3 md:h-3.5 ${user.membership === 'Premium' ? (isDarkMode ? 'text-brand-accent' : 'text-brand-primary') : (isDarkMode ? 'text-white/20' : 'text-gray-400')}`} />
                       <span className={`text-[10px] md:text-xs font-bold ${user.membership === 'Premium' ? (isDarkMode ? 'text-brand-accent' : 'text-brand-primary') : (isDarkMode ? 'text-white/40' : 'text-gray-500')}`}>
                        {user.membership}
                       </span>
                    </div>
                  </td>
                  <td className="py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`flex items-center gap-1.5 md:gap-2 px-2.5 py-0.5 md:py-1 rounded-lg border ${user.status === 'Active' ? (isDarkMode ? 'bg-brand-accent/5 border-brand-accent/20 text-brand-accent' : 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary shadow-sm') : (isDarkMode ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-700 shadow-sm')}`}>
                        <span className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full animate-pulse ${user.status === 'Active' ? (isDarkMode ? 'bg-brand-accent' : 'bg-brand-primary') : 'bg-red-500'}`} />
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">{user.status}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 md:py-4">
                    <span className={`text-[10px] md:text-xs font-medium transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>{user.created_at}</span>
                  </td>
                  <td className="py-3 md:py-4">
                    <span className={`text-[10px] md:text-xs font-medium transition-colors ${isDarkMode ? 'text-white/20' : 'text-gray-500'}`}>{user.lastActive}</span>
                  </td>
                  <td className="py-3 md:py-4 text-right pr-4">
                    <div className="flex items-center justify-end gap-0.5 md:gap-1">
                      <button 
                        type="button"
                        onClick={() => handleOpenModal('detail', user)}
                        className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${isDarkMode ? 'text-white/20 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                        title="View Detail"
                      >
                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => toggleStatus(user)}
                        className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${user.status === 'Active' 
                          ? (isDarkMode ? 'text-white/20 hover:text-red-400 hover:bg-red-500/5' : 'text-gray-400 hover:text-red-600 hover:bg-red-50') 
                          : (isDarkMode ? 'text-white/20 hover:text-brand-accent hover:bg-brand-accent/5' : 'text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5')
                        }`}
                        title={user.status === 'Active' ? 'Suspend User' : 'Activate User'}
                      >
                        {user.status === 'Active' ? <UserX className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <UserCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleOpenModal('edit', user)}
                        className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${isDarkMode ? 'text-white/20 hover:text-brand-accent hover:bg-brand-accent/5' : 'text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5'}`}
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleOpenModal('delete', user)}
                        className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${isDarkMode ? 'text-white/20 hover:text-red-500 hover:bg-red-500/5' : 'text-gray-400 hover:text-red-500 hover:bg-red-500/5'}`}
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="opacity-20 flex flex-col items-center gap-4">
                      <Search className="w-12 h-12" />
                      <p className="text-sm font-bold uppercase tracking-[0.2em]">Data user tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        isDarkMode={isDarkMode}
        size={modalType === 'delete' ? 'max-w-[400px]' : (modalType === 'detail' ? 'md:max-w-[800px] sm:max-w-[650px] w-[95%]' : 'md:max-w-[700px] sm:max-w-[600px] w-[95%]')}
        title={
          modalType === 'add' ? 'Tambah Pengguna Baru' : 
          modalType === 'edit' ? 'Edit Profil Pengguna' : 
          modalType === 'delete' ? 'Hapus Pengguna' : 
          'Detail Profil CRM'
        }
      >
        {modalType === 'delete' ? (
          <div className="space-y-4 md:space-y-6">
            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border ${isDarkMode ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-100'}`}>
              <p className={`text-[11px] md:text-sm leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                Apakah Anda yakin ingin menghapus akun <span className="font-bold text-red-500">{selectedUser?.name}</span>? 
                Seluruh data aktivitas dan riwayat konsultasi user ini akan dihapus permanen.
              </p>
            </div>
            <div className="flex justify-end gap-2 md:gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'}`}
              >
                Batal
              </button>
              <button onClick={handleDelete} className="px-4 md:px-6 py-2 md:py-3 bg-red-500 text-white rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95">
                Hapus
              </button>
            </div>
          </div>
        ) : modalType === 'detail' ? (
          <div className="space-y-5 md:space-y-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
              <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[32px] flex items-center justify-center border-4 flex-shrink-0 ${isDarkMode ? 'bg-gradient-to-br from-brand-accent/20 to-brand-primary/20 text-brand-accent border-white/5 shadow-brand-accent/5' : 'bg-brand-primary/10 text-brand-primary border-gray-100 shadow-sm'}`}>
                <User className="w-6 h-6 md:w-10 md:h-10" />
              </div>
              <div className="text-center sm:text-left min-w-0">
                <h4 className={`text-xl md:text-2xl font-serif font-black truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser?.name}</h4>
                <p className={`text-[11px] md:text-sm font-medium truncate ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>{selectedUser?.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 md:mt-2">
                  <span className={`px-2 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary shadow-sm'}`}>
                    {selectedUser?.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-[0.15em] ${selectedUser?.membership === 'Premium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-500/10 text-gray-400'}`}>
                    {selectedUser?.membership}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 text-brand-accent">
                  <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-accent" />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Joined</span>
                </div>
                <p className={`text-xs md:text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser?.created_at}</p>
              </div>
              <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 text-brand-accent">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-accent" />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Last Active</span>
                </div>
                <p className={`text-xs md:text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser?.lastActive}</p>
              </div>
            </div>

            <div className={`p-4 md:p-6 rounded-2xl md:rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
              <h5 className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4 ${isDarkMode ? 'text-white/20' : 'text-gray-400'}`}>Aktivitas CRM</h5>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-accent" />
                    <span className="text-[11px] md:text-xs font-medium">Konsultasi Chat AI</span>
                  </div>
                  <span className="text-xs md:text-sm font-black">{selectedUser?.consultations} Sesi</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-accent" />
                    <span className="text-[11px] md:text-xs font-medium">Artikel Terakhir</span>
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-right max-w-[150px] md:max-w-[180px] truncate">{selectedUser?.lastArticle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-accent" />
                    <span className="text-[11px] md:text-xs font-medium">Produk Terakhir</span>
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-right max-w-[150px] md:max-w-[180px] truncate">{selectedUser?.lastProduct}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${selectedUser?.status === 'Active' ? 'bg-brand-accent' : 'bg-red-500'}`} />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Status: {selectedUser?.status}</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className={`w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight shadow-brand-accent/20' : 'bg-brand-primary text-white hover:opacity-95 shadow-brand-primary/20'}`}
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="sm:col-span-2">
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Nama Lengkap</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm font-semibold ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-primary/50 shadow-sm'}`} 
                  placeholder="Nama lengkap" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Email Aktif</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm font-semibold ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-primary/50 shadow-sm'}`} 
                  placeholder="email@example.com" 
                />
              </div>
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Role</label>
                <select 
                  name="role"
                  value={formData.role || 'user'}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm font-bold appearance-none cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50 shadow-sm'}`}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Akses</label>
                <select 
                  name="membership"
                  value={formData.membership || 'Regular'}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm font-bold appearance-none cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50 shadow-sm'}`}
                >
                  <option value="Regular">Regular</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Status</label>
                <select 
                  name="status"
                  value={formData.status || 'Active'}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm font-bold appearance-none cursor-pointer ${isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-brand-accent/50' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-brand-primary/50 shadow-sm'}`}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end pt-4 border-t border-white/5 gap-2 md:gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 shadow-sm'}`}
              >
                Batal
              </button>
              <button 
                type="submit"
                className={`w-full sm:w-auto px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-accent/10 active:scale-95 ${isDarkMode ? 'bg-brand-accent text-black hover:bg-brand-highlight' : 'bg-brand-primary text-white hover:opacity-95'}`}
              >
                {modalType === 'add' ? 'Simpan' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default UserTable;
