"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import ImageCropper from "@/components/ui/ImageCropper";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/users/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || "",
          phone: data.data.phone || "",
          address: data.data.address || "",
        });
      }
    } catch {
      showToast("error", "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("error", "Format file tidak didukung. Gunakan JPG, PNG, atau WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Ukuran file maksimal 5MB");
      return;
    }

    // Create a preview URL and open cropper
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset file input so user can re-select same file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperImage(null);
    setUploading(true);

    try {
      // Upload the cropped file
      const fd = new FormData();
      fd.append("file", new File([croppedBlob], "profile.png", { type: "image/png" }));
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        showToast("error", uploadData.error || "Gagal mengupload foto");
        return;
      }

      // Update profile with new image URL
      const updateRes = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImage: uploadData.data.url }),
      });
      const updateData = await updateRes.json();

      if (updateData.success) {
        setProfile(updateData.data);
        showToast("success", "Foto profil berhasil diperbarui!");
        await updateSession();
      } else {
        showToast("error", updateData.error || "Gagal memperbarui foto profil");
      }
    } catch {
      showToast("error", "Terjadi kesalahan saat mengupload foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setEditing(false);
        showToast("success", "Profil berhasil diperbarui!");
        await updateSession();
      } else {
        showToast("error", data.error || "Gagal memperbarui profil");
      }
    } catch {
      showToast("error", "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("error", "Password baru dan konfirmasi tidak cocok");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("error", "Password baru minimal 6 karakter");
      return;
    }
    
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/users/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Password berhasil diubah!");
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showToast("error", data.error || "Gagal mengubah password");
      }
    } catch {
      showToast("error", "Terjadi kesalahan saat mengubah password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const userName = profile?.name || session?.user?.name || "Pengguna";
  const userEmail = profile?.email || session?.user?.email || "email@contoh.com";
  const userId = profile?.id || session?.user?.id || "USR-0000";
  const userInitial = userName.charAt(0).toUpperCase();
  const profileImage = profile?.profileImage || null;
  const memberId = `DT-${new Date().getFullYear()}-${userId.slice(-4).toUpperCase()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-12 w-full animate-in fade-in duration-500">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperImage(null)}
        />
      )}

      {/* Page Header */}
      <header className="mb-6">
        <h1 className="font-h1 text-h1 text-on-surface">Profil Pengguna</h1>
        <p className="font-body-base text-on-surface-variant mt-1">
          Kelola informasi pribadi dan pengaturan akun Anda.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & ID Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Profile Summary Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={userName}
                  className="w-32 h-32 rounded-full border-4 border-surface-container-low shadow-sm object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-surface-container-low shadow-sm bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="text-5xl font-bold">{userInitial}</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors shadow-md disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                )}
              </button>
            </div>
            <h2 className="font-h2 text-h2 text-on-surface mb-1">{userName}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Anggota Perpustakaan</p>

            <div className="w-full bg-surface-container-low rounded-lg p-4 flex justify-between items-center mb-4">
              <div className="text-left">
                <p className="font-label-sm text-label-sm text-outline uppercase">ID Anggota</p>
                <p className="font-label-md text-label-md text-on-surface">{memberId}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(memberId);
                  showToast("success", "ID berhasil disalin!");
                }}
                className="text-primary hover:text-primary/70 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
              </button>
            </div>

            <div className="w-full flex justify-between text-left text-sm">
              <span className="font-body-sm text-on-surface-variant">Bergabung sejak</span>
              <span className="font-label-md text-on-surface">
                {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : new Date().getFullYear()}
              </span>
            </div>
          </div>

          {/* Digital ID Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container p-6">
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">badge</span>
              Kartu Anggota Digital
            </h3>
            <div className="bg-primary text-on-primary rounded-xl p-5 flex flex-col items-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative z-10 w-full flex justify-between items-start mb-6">
                <div className="font-bold text-lg tracking-wider">DISPUSIP</div>
                <span className="material-symbols-outlined text-[24px]">local_library</span>
              </div>
              <div className="relative z-10 bg-white p-3 rounded-lg mb-4 w-3/4 aspect-square flex items-center justify-center">
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-on-surface text-[64px]">qr_code_2</span>
                  <p className="text-xs text-outline">Scan untuk verifikasi</p>
                </div>
              </div>
              <div className="relative z-10 w-full text-center">
                <p className="font-mono text-sm tracking-widest bg-white/20 py-1 rounded">{memberId}</p>
                <p className="text-xs mt-2 text-white/70">Tunjukkan kode ini saat di perpustakaan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms and Settings */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Informasi Pribadi */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
            <div className="border-b border-surface-container px-6 py-4 flex justify-between items-center">
              <h3 className="font-h3 text-h3 text-on-surface">Informasi Pribadi</h3>
              <button
                onClick={() => {
                  if (editing) {
                    // Cancel editing, reset form
                    setFormData({
                      name: profile?.name || "",
                      phone: profile?.phone || "",
                      address: profile?.address || "",
                    });
                  }
                  setEditing(!editing);
                }}
                className="text-sm font-label-md text-primary hover:text-primary/70 transition-colors"
              >
                {editing ? "Batal" : "Edit"}
              </button>
            </div>
            <div className="p-6">
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Nama Lengkap</label>
                  <input
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                    readOnly={!editing}
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Email</label>
                  <input
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-2 text-on-surface/60 focus:outline-none transition-shadow cursor-not-allowed"
                    readOnly
                    type="email"
                    value={userEmail}
                  />
                  <p className="text-xs text-outline mt-1">Email tidak dapat diubah</p>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">No. Telepon</label>
                  <input
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                    readOnly={!editing}
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Belum diisi"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Alamat</label>
                  <textarea
                    className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow resize-none"
                    readOnly={!editing}
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Belum diisi"
                  />
                </div>
                {editing && (
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      Simpan Perubahan
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Preferensi Notifikasi */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
            <div className="border-b border-surface-container px-6 py-4">
              <h3 className="font-h3 text-h3 text-on-surface">Preferensi Notifikasi</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Pilih bagaimana Anda ingin menerima pembaruan dari kami.
              </p>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-5">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => setEmailNotif(!emailNotif)}
                    className={`relative inline-flex items-center mt-1 w-11 h-6 rounded-full transition-colors flex-shrink-0 ${emailNotif ? "bg-primary" : "bg-outline-variant"}`}
                  >
                    <span className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${emailNotif ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <div className="flex-1">
                    <h4 className="font-label-md text-label-md text-on-surface">Notifikasi Email</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Pemberitahuan tentang buku yang dipinjam, jatuh tempo, dan pembaruan sistem.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => setPushNotif(!pushNotif)}
                    className={`relative inline-flex items-center mt-1 w-11 h-6 rounded-full transition-colors flex-shrink-0 ${pushNotif ? "bg-primary" : "bg-outline-variant"}`}
                  >
                    <span className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${pushNotif ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <div className="flex-1">
                    <h4 className="font-label-md text-label-md text-on-surface">Push Notifications</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Pemberitahuan instan di perangkat Anda saat aplikasi sedang tidak dibuka.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => setSmsNotif(!smsNotif)}
                    className={`relative inline-flex items-center mt-1 w-11 h-6 rounded-full transition-colors flex-shrink-0 ${smsNotif ? "bg-primary" : "bg-outline-variant"}`}
                  >
                    <span className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${smsNotif ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <div className="flex-1">
                    <h4 className="font-label-md text-label-md text-on-surface">Pesan SMS</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Pengingat jatuh tempo penting yang dikirimkan langsung ke nomor ponsel Anda.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Keamanan Akun */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
            <div className="border-b border-surface-container px-6 py-4">
              <h3 className="font-h3 text-h3 text-on-surface">Keamanan Akun</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface">Password</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Ganti password akun Anda secara berkala untuk keamanan.
                  </p>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 border border-outline rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors ease-in-out duration-150"
                >
                  Ganti Password
                </button>
              </div>

              {/* Password Modal / Inline Form */}
              {showPasswordModal && (
                <form onSubmit={handlePasswordChange} className="mt-6 pt-6 border-t border-surface-container flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h4 className="font-label-md text-label-md text-on-surface mb-2">Formulir Penggantian Password</h4>
                  
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Password Saat Ini</label>
                    <input
                      required
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                      placeholder="Masukkan password Anda saat ini"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Password Baru</label>
                      <input
                        required
                        type="password"
                        minLength={6}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                        placeholder="Minimal 6 karakter"
                      />
                    </div>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Konfirmasi Password Baru</label>
                      <input
                        required
                        type="password"
                        minLength={6}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                        placeholder="Ulangi password baru"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      }}
                      className="px-4 py-2 border border-outline rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {passwordLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      Simpan Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
