import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  AlertCircle,
  PenTool,
} from 'lucide-react';
import {
  EducationRecord,
  DEGREE_PRESETS,
  FIELD_OF_STUDY_PRESETS,
  isPresetDegree,
  isPresetFieldOfStudy,
} from '../../types/profile';

interface EducationSectionProps {
  records: EducationRecord[];
  onChange: (updated: EducationRecord[]) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({ records, onChange }) => {
  // Track whether "Other" mode has been activated for degree/field on records
  const [customDegreeActive, setCustomDegreeActive] = useState<Record<string, boolean>>({});
  const [customFieldActive, setCustomFieldActive] = useState<Record<string, boolean>>({});
  // Track touched state for inline error validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleAdd = () => {
    const newRecord: EducationRecord = {
      id: `edu-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      degree: '',
      fieldOfStudy: '',
      institution: '',
      graduationYear: '',
      cgpa: '',
    };
    onChange([...records, newRecord]);
  };

  const handleRemove = (id: string) => {
    onChange(records.filter((rec) => rec.id !== id));
    // Clean up local tracked state
    setCustomDegreeActive((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCustomFieldActive((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleBlur = (fieldKey: string) => {
    setTouched((prev) => ({ ...prev, [fieldKey]: true }));
  };

  const handleUpdate = (id: string, field: keyof EducationRecord, value: string) => {
    setTouched((prev) => ({ ...prev, [`${id}-${field}`]: true }));
    onChange(
      records.map((rec) => {
        if (rec.id === id) {
          return { ...rec, [field]: value };
        }
        return rec;
      })
    );
  };

  const handleDegreeSelectChange = (id: string, selected: string) => {
    setTouched((prev) => ({ ...prev, [`${id}-degree`]: true }));
    if (selected === 'Other') {
      setCustomDegreeActive((prev) => ({ ...prev, [id]: true }));
      // If previous value was a preset, clear it so user can enter custom value
      const currentRecord = records.find((r) => r.id === id);
      if (currentRecord && isPresetDegree(currentRecord.degree)) {
        handleUpdate(id, 'degree', '');
      }
    } else {
      setCustomDegreeActive((prev) => ({ ...prev, [id]: false }));
      handleUpdate(id, 'degree', selected);
    }
  };

  const handleFieldSelectChange = (id: string, selected: string) => {
    if (selected === 'Other') {
      setCustomFieldActive((prev) => ({ ...prev, [id]: true }));
      const currentRecord = records.find((r) => r.id === id);
      if (currentRecord && isPresetFieldOfStudy(currentRecord.fieldOfStudy)) {
        handleUpdate(id, 'fieldOfStudy', '');
      }
    } else {
      setCustomFieldActive((prev) => ({ ...prev, [id]: false }));
      handleUpdate(id, 'fieldOfStudy', selected);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#E8E6F0] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F0EEFA] text-[#6558D9] border border-[#E0DDF0] flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#20243A]">Education</h2>
            <p className="text-xs text-[#73778C]">
              Record your degrees, diplomas, or relevant academic training.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4F46BA] bg-[#F0EEFA] hover:bg-[#EBE7F8] rounded-lg transition-colors border border-[#DCD8F0] self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Qualification</span>
        </button>
      </div>

      {records.length === 0 ? (
        <div className="p-7 text-center border border-dashed border-[#DCD8F0] rounded-xl bg-[#F5F4FA]">
          <GraduationCap className="w-8 h-8 text-[#9E9EAF] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#20243A]">No education records added yet</p>
          <p className="text-xs text-[#73778C] mt-1 max-w-sm mx-auto">
            Adding at least one qualification with your degree and institution helps companies
            evaluate your academic foundation.
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#6558D9] hover:bg-[#5346C8] rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record, index) => {
            // Determine degree dropdown value and custom mode:
            // Custom mode is active if user clicked "Other" OR record has a non-preset value (legacy or custom)
            const isDegreeCustom =
              Boolean(customDegreeActive[record.id]) ||
              (record.degree !== '' && !isPresetDegree(record.degree));
            const degreeSelectValue = isDegreeCustom ? 'Other' : record.degree;
            const degreeCustomValue = isPresetDegree(record.degree) ? '' : record.degree;

            // Determine field of study dropdown value and custom mode:
            const isFieldCustom =
              Boolean(customFieldActive[record.id]) ||
              (record.fieldOfStudy !== '' && !isPresetFieldOfStudy(record.fieldOfStudy));
            const fieldSelectValue = isFieldCustom ? 'Other' : record.fieldOfStudy;
            const fieldCustomValue = isPresetFieldOfStudy(record.fieldOfStudy)
              ? ''
              : record.fieldOfStudy;

            // Validation checks
            const isDegreeTouched = touched[`${record.id}-degree`];
            const isDegreeEmpty = !record.degree.trim();
            const degreeError = isDegreeTouched && isDegreeEmpty ? 'Degree or qualification is required.' : null;

            const isInstTouched = touched[`${record.id}-institution`];
            const isInstEmpty = !record.institution.trim();
            const instError = isInstTouched && isInstEmpty ? 'Institution or university is required.' : null;

            return (
              <div
                key={record.id}
                className="p-5 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA]/70 relative hover:border-[#DCD8F0] transition-colors"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#73778C] flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#6558D9]" />
                    Education #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemove(record.id)}
                    aria-label={`Remove education entry #${index + 1}`}
                    className="p-1 text-[#73778C] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Remove this qualification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Degree / Qualification Dropdown + Custom Field */}
                  <div className="sm:col-span-1 lg:col-span-2">
                    <label
                      htmlFor={`degree-select-${record.id}`}
                      className="block text-xs font-semibold text-[#20243A] mb-1"
                    >
                      Degree or Qualification <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <select
                        id={`degree-select-${record.id}`}
                        aria-label={`Degree or qualification for entry #${index + 1}`}
                        value={degreeSelectValue}
                        onChange={(e) => handleDegreeSelectChange(record.id, e.target.value)}
                        onBlur={() => handleBlur(`${record.id}-degree`)}
                        className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border transition-all text-[#20243A] bg-white focus:outline-none cursor-pointer ${
                          degreeError
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/20'
                            : isDegreeTouched && !isDegreeEmpty
                            ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                            : 'border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10'
                        }`}
                      >
                        <option value="">Select Degree / Qualification...</option>
                        {DEGREE_PRESETS.map((deg) => (
                          <option key={deg} value={deg}>
                            {deg}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Degree Input Field revealed when "Other" or custom legacy value is selected */}
                    {isDegreeCustom && (
                      <div className="mt-2 relative animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                          <PenTool className="w-3.5 h-3.5" />
                        </div>
                        <input
                          id={`custom-degree-${record.id}`}
                          aria-label={`Custom degree or qualification for entry #${index + 1}`}
                          type="text"
                          value={degreeCustomValue}
                          onChange={(e) => handleUpdate(record.id, 'degree', e.target.value)}
                          onBlur={() => handleBlur(`${record.id}-degree`)}
                          placeholder="Specify custom degree (e.g. Associate Degree, Juris Doctor)"
                          className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border transition-all text-[#20243A] placeholder-[#9E9EAF] focus:outline-none bg-white ${
                            degreeError
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/20'
                              : 'border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10'
                          }`}
                        />
                      </div>
                    )}

                    {degreeError && (
                      <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{degreeError}</span>
                      </p>
                    )}
                  </div>

                  {/* Field of Study Dropdown + Custom Field */}
                  <div className="sm:col-span-1 lg:col-span-2">
                    <label
                      htmlFor={`field-select-${record.id}`}
                      className="block text-xs font-semibold text-[#20243A] mb-1"
                    >
                      Field of Study / Specialization
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <select
                        id={`field-select-${record.id}`}
                        aria-label={`Field of study for entry #${index + 1}`}
                        value={fieldSelectValue}
                        onChange={(e) => handleFieldSelectChange(record.id, e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="">Select Field of Study...</option>
                        {FIELD_OF_STUDY_PRESETS.map((field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Field of Study Input Field revealed when "Other" or custom legacy value is selected */}
                    {isFieldCustom && (
                      <div className="mt-2 relative animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                          <PenTool className="w-3.5 h-3.5" />
                        </div>
                        <input
                          id={`custom-field-${record.id}`}
                          aria-label={`Custom field of study for entry #${index + 1}`}
                          type="text"
                          value={fieldCustomValue}
                          onChange={(e) => handleUpdate(record.id, 'fieldOfStudy', e.target.value)}
                          placeholder="Specify custom field (e.g. Cognitive Science, Mechatronics)"
                          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Institution / University */}
                  <div className="sm:col-span-1 lg:col-span-2">
                    <label
                      htmlFor={`institution-${record.id}`}
                      className="block text-xs font-semibold text-[#20243A] mb-1"
                    >
                      Institution / University <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                        <School className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id={`institution-${record.id}`}
                        aria-label={`Institution for entry #${index + 1}`}
                        type="text"
                        value={record.institution}
                        onChange={(e) => handleUpdate(record.id, 'institution', e.target.value)}
                        onBlur={() => handleBlur(`${record.id}-institution`)}
                        placeholder="e.g. Stanford University"
                        className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border transition-all text-[#20243A] placeholder-[#9E9EAF] focus:outline-none bg-white ${
                          instError
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/20'
                            : isInstTouched && !isInstEmpty
                            ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                            : 'border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10'
                        }`}
                      />
                    </div>
                    {instError && (
                      <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{instError}</span>
                      </p>
                    )}
                  </div>

                  {/* Graduation Year */}
                  <div className="sm:col-span-1 lg:col-span-1">
                    <label
                      htmlFor={`grad-year-${record.id}`}
                      className="block text-xs font-semibold text-[#20243A] mb-1"
                    >
                      Graduation Year
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id={`grad-year-${record.id}`}
                        aria-label={`Graduation year for entry #${index + 1}`}
                        type="text"
                        value={record.graduationYear}
                        onChange={(e) => handleUpdate(record.id, 'graduationYear', e.target.value)}
                        placeholder="e.g. 2025"
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* CGPA */}
                  <div className="sm:col-span-1 lg:col-span-1">
                    <label
                      htmlFor={`cgpa-${record.id}`}
                      className="block text-xs font-semibold text-[#20243A] mb-1"
                    >
                      CGPA
                    </label>
                    <input
                      id={`cgpa-${record.id}`}
                      aria-label={`CGPA for entry #${index + 1}`}
                      type="text"
                      value={record.cgpa ?? ''}
                      onChange={(e) => handleUpdate(record.id, 'cgpa', e.target.value)}
                      placeholder="e.g. 8.6/10"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
