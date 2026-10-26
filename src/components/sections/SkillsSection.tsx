import React, { useState } from 'react';
import {
  Code2,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  SkillRecord,
  RadixCategoryCode,
  SkillConfidence,
  RADIX_CATEGORY_LIST,
  RADIX_SKILL_CATEGORIES,
  isValidRadixCategoryCode,
} from '../../types/profile';

interface SkillsSectionProps {
  skills: SkillRecord[];
  onChange: (updated: SkillRecord[]) => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ skills, onChange }) => {
  // New skill form state
  const [skillName, setSkillName] = useState('');
  const [categoryCode, setCategoryCode] = useState<RadixCategoryCode>('COD');
  const [evidence, setEvidence] = useState('');
  const [confidence, setConfidence] = useState<SkillConfidence | ''>('medium');
  const [formError, setFormError] = useState<string | null>(null);

  // Editing existing skill state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSkillName, setEditSkillName] = useState('');
  const [editCategoryCode, setEditCategoryCode] = useState<RadixCategoryCode>('COD');
  const [editEvidence, setEditEvidence] = useState('');
  const [editConfidence, setEditConfidence] = useState<SkillConfidence | ''>('medium');
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Filter state for quick viewing
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('ALL');

  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = skillName.trim();
    if (!trimmed) {
      setFormError('Please enter a skill name.');
      return;
    }

    if (!isValidRadixCategoryCode(categoryCode)) {
      setFormError('Please select a valid official RADIX category code.');
      return;
    }

    // Duplicate check: case-insensitive and trimmed whitespace comparison
    const isDuplicate = skills.some(
      (s) => s.skillName.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`"${trimmed}" is already added to your skills.`);
      return;
    }

    const newSkill: SkillRecord = {
      id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      skillName: trimmed,
      categoryCode,
      evidence: evidence.trim(),
      confidence: confidence || null,
    };

    onChange([...skills, newSkill]);
    setSkillName('');
    setEvidence('');
    setFormError(null);
  };

  const handleRemoveSkill = (id: string) => {
    onChange(skills.filter((s) => s.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditFormError(null);
    }
  };

  const startEdit = (skill: SkillRecord) => {
    setEditingId(skill.id);
    setEditSkillName(skill.skillName);
    setEditCategoryCode(skill.categoryCode);
    setEditEvidence(skill.evidence || '');
    setEditConfidence(skill.confidence || '');
    setEditFormError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormError(null);
  };

  const saveEdit = (id: string) => {
    const trimmed = editSkillName.trim();
    if (!trimmed) {
      setEditFormError('Skill name cannot be blank.');
      return;
    }

    if (!isValidRadixCategoryCode(editCategoryCode)) {
      setEditFormError('Please select a valid official RADIX category code.');
      return;
    }

    // Duplicate check ignoring case and whitespace against other skills
    const isDuplicate = skills.some(
      (s) => s.id !== id && s.skillName.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setEditFormError(`"${trimmed}" is already used by another skill.`);
      return;
    }

    onChange(
      skills.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            skillName: trimmed,
            categoryCode: editCategoryCode,
            evidence: editEvidence.trim(),
            confidence: editConfidence || null,
          };
        }
        return s;
      })
    );
    setEditingId(null);
    setEditFormError(null);
  };

  const filteredSkills =
    selectedFilterCategory === 'ALL'
      ? skills
      : skills.filter((s) => s.categoryCode === selectedFilterCategory);

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#E8E6F0] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F0EEFA] text-[#6558D9] border border-[#E0DDF0] flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#20243A]">Technical Skills</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F0EEFA] text-[#6558D9] border border-[#E8E6F0] tabular-nums">
                {skills.length} added
              </span>
            </div>
            <p className="text-xs text-[#73778C]">
              Categorize competencies using the official 13 RADIX taxonomy domains.
            </p>
          </div>
        </div>
      </div>

      {/* Add Skill Form Box */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#F5F4FA] border border-[#E8E6F0] mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#20243A] mb-3 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-[#6558D9]" />
          Add New Skill
        </h3>

        <form onSubmit={handleAddSkill} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Skill Name */}
            <div className="sm:col-span-5">
              <label htmlFor="skillNameInput" className="block text-xs font-semibold text-[#20243A] mb-1">
                Skill Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="skillNameInput"
                type="text"
                value={skillName}
                onChange={(e) => {
                  setSkillName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. React, Python, PostgreSQL, Kafka"
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
              />
            </div>

            {/* RADIX Category Dropdown */}
            <div className="sm:col-span-4">
              <label htmlFor="skillCategorySelect" className="block text-xs font-semibold text-[#20243A] mb-1">
                RADIX Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="skillCategorySelect"
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value as RadixCategoryCode)}
                  className="w-full appearance-none px-3 py-1.5 pr-8 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] focus:outline-none"
                >
                  {RADIX_CATEGORY_LIST.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      [{cat.code}] {cat.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[#73778C]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Confidence Level */}
            <div className="sm:col-span-3">
              <label htmlFor="skillConfidenceSelect" className="block text-xs font-semibold text-[#20243A] mb-1">
                Confidence Level
              </label>
              <select
                id="skillConfidenceSelect"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as SkillConfidence | '')}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] focus:outline-none"
              >
                <option value="high">High (Deep expertise)</option>
                <option value="medium">Medium (Working knowledge)</option>
                <option value="low">Low (Familiar / Learning)</option>
                <option value="">Unset (Not specified)</option>
              </select>
            </div>
          </div>

          {/* Optional Evidence / Supporting Context */}
          <div>
            <label htmlFor="skillEvidenceInput" className="block text-xs font-semibold text-[#20243A] mb-1">
              Evidence / Supporting Context <span className="text-[#73778C] font-normal">(Optional)</span>
            </label>
            <input
              id="skillEvidenceInput"
              type="text"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="e.g. Built microservices with 500k daily reqs, LeetCode Guardian, production deployment"
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
            />
          </div>

          {formError && (
            <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {formError}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#6558D9] hover:bg-[#5346C8] active:bg-[#4537B8] rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>
        </form>
      </div>

      {/* Added Skills Display */}
      {skills.length === 0 ? (
        <div className="p-7 text-center border border-dashed border-[#DCD8F0] rounded-xl bg-[#F5F4FA]">
          <Code2 className="w-8 h-8 text-[#9E9EAF] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#20243A]">No skills added yet</p>
          <p className="text-xs text-[#73778C] mt-1 max-w-sm mx-auto">
            Use the form above to add your primary programming languages, frameworks, and foundational CS skills.
          </p>
        </div>
      ) : (
        <div>
          {/* Quick Category Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedFilterCategory('ALL')}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all border ${
                selectedFilterCategory === 'ALL'
                  ? 'bg-[#20243A] text-white border-[#20243A]'
                  : 'bg-[#F5F4FA] text-[#73778C] border-[#E8E6F0] hover:bg-[#F0EEFA]'
              }`}
            >
              All Categories ({skills.length})
            </button>
            {RADIX_CATEGORY_LIST.filter((cat) => skills.some((s) => s.categoryCode === cat.code)).map(
              (cat) => {
                const count = skills.filter((s) => s.categoryCode === cat.code).length;
                const isSelected = selectedFilterCategory === cat.code;
                return (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => setSelectedFilterCategory(cat.code)}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-[#6558D9] text-white border-[#6558D9]'
                        : 'bg-[#F5F4FA] text-[#73778C] border-[#E8E6F0] hover:bg-[#F0EEFA]'
                    }`}
                  >
                    {cat.code} ({count})
                  </button>
                );
              }
            )}
          </div>

          {/* Skill Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredSkills.map((skill) => {
              const catDef = RADIX_SKILL_CATEGORIES[skill.categoryCode] || RADIX_SKILL_CATEGORIES.OTHER;
              const isEditing = editingId === skill.id;

              if (isEditing) {
                return (
                  <div
                    key={skill.id}
                    className="p-4 rounded-xl border border-[#DCD8F0] bg-[#F0EEFA]/40 sm:col-span-2 space-y-2.5 shadow-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-[#20243A] mb-0.5">
                          Skill Name
                        </label>
                        <input
                          type="text"
                          value={editSkillName}
                          onChange={(e) => {
                            setEditSkillName(e.target.value);
                            if (editFormError) setEditFormError(null);
                          }}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-[#E8E6F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#6558D9]/20 focus:border-[#6558D9]"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-[#20243A] mb-0.5">
                          Category
                        </label>
                        <select
                          value={editCategoryCode}
                          onChange={(e) => setEditCategoryCode(e.target.value as RadixCategoryCode)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-[#E8E6F0] bg-white focus:outline-none"
                        >
                          {RADIX_CATEGORY_LIST.map((cat) => (
                            <option key={cat.code} value={cat.code}>
                              [{cat.code}] {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-[#20243A] mb-0.5">
                          Confidence
                        </label>
                        <select
                          value={editConfidence}
                          onChange={(e) => setEditConfidence(e.target.value as SkillConfidence | '')}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-[#E8E6F0] bg-white focus:outline-none"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                          <option value="">Unset (Optional)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#20243A] mb-0.5">
                        Evidence (Optional)
                      </label>
                      <input
                        type="text"
                        value={editEvidence}
                        onChange={(e) => setEditEvidence(e.target.value)}
                        placeholder="Context or achievements"
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-[#E8E6F0] bg-white focus:outline-none"
                      />
                    </div>

                    {editFormError && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {editFormError}
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-2.5 py-1 text-xs font-medium text-[#73778C] bg-white hover:bg-slate-100 border border-[#E8E6F0] rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(skill.id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-[#6558D9] hover:bg-[#5346C8] rounded-lg flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={skill.id}
                  className="p-3.5 rounded-xl border border-[#E8E6F0] bg-white hover:border-[#DCD8F0] hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#20243A]">
                          {skill.skillName}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${catDef.badgeClass}`}
                          title={`RADIX Category: ${catDef.label}`}
                        >
                          {skill.categoryCode} · {catDef.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(skill)}
                          aria-label={`Edit skill ${skill.skillName}`}
                          className="p-1 text-[#73778C] hover:text-[#6558D9] hover:bg-[#F0EEFA] rounded-md transition-colors"
                          title="Edit skill"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.id)}
                          aria-label={`Remove skill ${skill.skillName}`}
                          className="p-1 text-[#73778C] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Remove skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Confidence & Evidence */}
                    <div className="mt-2 text-xs flex items-center gap-2 text-[#73778C]">
                      {skill.confidence ? (
                        <span className="capitalize font-medium text-[#20243A] flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              skill.confidence === 'high'
                                ? 'bg-emerald-500'
                                : skill.confidence === 'medium'
                                ? 'bg-[#6558D9]'
                                : 'bg-amber-500'
                            }`}
                          />
                          {skill.confidence} confidence
                        </span>
                      ) : (
                        <span className="text-[#9E9EAF] italic flex items-center gap-1.5 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DCD8F0]" />
                          Confidence unset
                        </span>
                      )}
                    </div>

                    {skill.evidence && (
                      <p className="mt-2 text-xs text-[#73778C] italic bg-[#F5F4FA] p-2 rounded-lg border border-[#E8E6F0]/80">
                        "{skill.evidence}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
