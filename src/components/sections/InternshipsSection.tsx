import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Building2, Tag } from 'lucide-react';
import { InternshipRecord } from '../../types/profile';

interface InternshipsSectionProps {
  records: InternshipRecord[];
  onChange: (updated: InternshipRecord[]) => void;
}

export const InternshipsSection: React.FC<InternshipsSectionProps> = ({ records, onChange }) => {
  const [techInputs, setTechInputs] = useState<{ [id: string]: string }>({});

  const handleAdd = () => {
    const newRecord: InternshipRecord = {
      id: `intern-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      isOngoing: false,
      description: '',
      technologies: [],
    };
    onChange([...records, newRecord]);
  };

  const handleRemove = (id: string) => {
    onChange(records.filter((rec) => rec.id !== id));
  };

  const handleUpdate = (id: string, field: keyof InternshipRecord, value: any) => {
    onChange(
      records.map((rec) => {
        if (rec.id === id) {
          return { ...rec, [field]: value };
        }
        return rec;
      })
    );
  };

  const handleAddTech = (id: string) => {
    const text = (techInputs[id] || '').trim();
    if (!text) return;

    const newTags = text
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const record = records.find((r) => r.id === id);
    if (!record) return;

    const currentTech = record.technologies || [];
    const merged = Array.from(new Set([...currentTech, ...newTags]));

    handleUpdate(id, 'technologies', merged);
    setTechInputs((prev) => ({ ...prev, [id]: '' }));
  };

  const handleRemoveTech = (id: string, techToRemove: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    handleUpdate(
      id,
      'technologies',
      record.technologies.filter((t) => t !== techToRemove)
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#E8E6F0] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F0EEFA] text-[#6558D9] border border-[#E0DDF0] flex items-center justify-center font-bold text-sm">
            5
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#20243A]">Internships & Experience</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F0EEFA] text-[#6558D9] border border-[#E8E6F0] tabular-nums">
                {records.length}
              </span>
            </div>
            <p className="text-xs text-[#73778C]">
              Highlight professional internships, co-ops, research assistantships, or industry experience.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4F46BA] bg-[#F0EEFA] hover:bg-[#EBE7F8] rounded-lg transition-colors border border-[#DCD8F0] self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Experience</span>
        </button>
      </div>

      {records.length === 0 ? (
        <div className="p-7 text-center border border-dashed border-[#DCD8F0] rounded-xl bg-[#F5F4FA]">
          <Briefcase className="w-8 h-8 text-[#9E9EAF] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#20243A]">No work experience or internships recorded</p>
          <p className="text-xs text-[#73778C] mt-1 max-w-sm mx-auto">
            Internships, part-time technical roles, and research assistantships show applied workplace impact.
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#6558D9] hover:bg-[#5346C8] rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Experience</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record, index) => (
            <div
              key={record.id}
              className="p-5 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA]/70 relative hover:border-[#DCD8F0] transition-colors"
            >
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#73778C] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#6558D9]" />
                  Role #{index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemove(record.id)}
                  aria-label={`Remove role #${index + 1}`}
                  className="p-1 text-[#73778C] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Remove this role"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mb-3">
                {/* Company / Organization */}
                <div className="sm:col-span-1 lg:col-span-4">
                  <label className="block text-xs font-semibold text-[#20243A] mb-1">
                    Company / Organization
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={record.company}
                      onChange={(e) => handleUpdate(record.id, 'company', e.target.value)}
                      placeholder="e.g. Acme Cloud Corp"
                      className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Job Title / Role */}
                <div className="sm:col-span-1 lg:col-span-4">
                  <label className="block text-xs font-semibold text-[#20243A] mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={record.role}
                    onChange={(e) => handleUpdate(record.id, 'role', e.target.value)}
                    placeholder="e.g. Backend Engineering Intern"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                  />
                </div>

                {/* Dates */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#20243A]">
                      Duration
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-[#73778C] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={record.isOngoing}
                        onChange={(e) => handleUpdate(record.id, 'isOngoing', e.target.checked)}
                        className="rounded border-[#E8E6F0] text-[#6558D9] focus:ring-[#6558D9] w-3.5 h-3.5"
                      />
                      <span>Currently ongoing</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={record.startDate}
                      onChange={(e) => handleUpdate(record.id, 'startDate', e.target.value)}
                      placeholder="Start (e.g. Jun 2024)"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-2 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                    />
                    <input
                      type="text"
                      disabled={record.isOngoing}
                      value={record.isOngoing ? 'Present' : record.endDate}
                      onChange={(e) => handleUpdate(record.id, 'endDate', e.target.value)}
                      placeholder="End (e.g. Aug 2024)"
                      className={`w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E6F0] bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none ${
                        record.isOngoing ? 'bg-[#F5F4FA] text-[#73778C] cursor-not-allowed' : 'focus:border-[#6558D9] focus:ring-2 focus:ring-[#6558D9]/10'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Responsibilities */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-[#20243A] mb-1">
                  Responsibilities & Key Deliverables
                </label>
                <textarea
                  rows={2}
                  value={record.description}
                  onChange={(e) => handleUpdate(record.id, 'description', e.target.value)}
                  placeholder="Describe your impact, tools deployed, metrics improved, or team accomplishments..."
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                />
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-xs font-semibold text-[#20243A] mb-1">
                  Technologies Used
                </label>

                {record.technologies && record.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {record.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#F0EEFA] text-[#4F46BA] border border-[#DCD8F0]"
                      >
                        <span>{tech}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(record.id, tech)}
                          className="hover:text-rose-600 rounded"
                          title={`Remove ${tech}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={techInputs[record.id] || ''}
                      onChange={(e) =>
                        setTechInputs((prev) => ({ ...prev, [record.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTech(record.id);
                        }
                      }}
                      placeholder="Add tech stack used (e.g. Go, Kafka, Docker, Kubernetes)"
                      className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTech(record.id)}
                    className="px-3 py-1 text-xs font-medium text-[#20243A] bg-white hover:bg-[#F5F4FA] border border-[#E8E6F0] rounded-lg transition-colors"
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
