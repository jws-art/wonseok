import React, { useState } from "react";
import { ClientProfile } from "../types";
import { User, UserPlus, Trash2, Heart, Edit2 } from "lucide-react";

interface ClientProfilesProps {
  profiles: ClientProfile[];
  selectedProfileId: string | null;
  onSelectProfile: (id: string) => void;
  onAddProfile: (profile: Omit<ClientProfile, "id">) => void;
  onDeleteProfile: (id: string) => void;
}

export default function ClientProfiles({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onAddProfile,
  onDeleteProfile
}: ClientProfilesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"남" | "여">("남");
  const [relationNotes, setRelationNotes] = useState("");
  const [defaultTemperature, setDefaultTemperature] = useState("36.5");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddProfile({
      name: name.trim(),
      birthDate: birthDate || undefined,
      gender,
      relationNotes: relationNotes.trim() || undefined,
      defaultTemperature: defaultTemperature.trim() || "36.5"
    });

    // Reset form
    setName("");
    setBirthDate("");
    setGender("남");
    setRelationNotes("");
    setDefaultTemperature("36.5");
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col" id="client-profiles-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          대상자 프로필 관리
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            isAdding
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
          id="btn-add-profile-toggle"
        >
          {isAdding ? "취소" : <><UserPlus className="w-3.5 h-3.5" /> 프로필 추가</>}
        </button>
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 mb-4 text-sm animate-fade-in" id="add-profile-form">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">이름 *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                id="input-profile-name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">성별</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("남")}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                    gender === "남"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-600"
                  }`}
                  id="btn-gender-male"
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => setGender("여")}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                    gender === "여"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-600"
                  }`}
                  id="btn-gender-female"
                >
                  여성
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">생년월일</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white text-xs text-gray-700"
                id="input-profile-birth"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">평균 체온 (℃)</label>
              <input
                type="text"
                value={defaultTemperature}
                onChange={(e) => setDefaultTemperature(e.target.value)}
                placeholder="36.5"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white"
                id="input-profile-temp"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">특이사항 / 관계 메모</label>
            <input
              type="text"
              value={relationNotes}
              onChange={(e) => setRelationNotes(e.target.value)}
              placeholder="예: 휠체어 이용자, 자조적인 성향이 강함 등"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-500 bg-white text-xs"
              id="input-profile-notes"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
            id="btn-profile-save"
          >
            프로필 저장
          </button>
        </form>
      ) : null}

      <div className="flex-1 overflow-y-auto max-h-[300px] md:max-h-none space-y-2 pr-1" id="profiles-list">
        {profiles.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <Heart className="w-8 h-8 mx-auto text-gray-300 mb-1" />
            <p className="text-xs">등록된 대상자가 없습니다.</p>
            <p className="text-[10px] text-gray-400 mt-0.5">상단의 '프로필 추가' 버튼을 눌러주세요.</p>
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => onSelectProfile(profile.id)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                selectedProfileId === profile.id
                  ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                  : "border-gray-100 hover:border-gray-200 bg-white"
              }`}
              id={`profile-item-${profile.id}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  selectedProfileId === profile.id ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {profile.name.substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-800 text-sm">{profile.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                      {profile.gender}
                    </span>
                  </div>
                  {profile.relationNotes && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{profile.relationNotes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">{profile.defaultTemperature}℃</span>
                <button
                  onClick={() => {
                    if (confirm(`${profile.name} 대상자의 프로필을 삭제하시겠습니까? 관련 작성 이력은 유지됩니다.`)) {
                      onDeleteProfile(profile.id);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="삭제"
                  id={`btn-delete-profile-${profile.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
