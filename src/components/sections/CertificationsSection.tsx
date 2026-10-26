import React from 'react';
import { Award, Plus, Trash2, Calendar, ExternalLink } from 'lucide-react';
import { CertificationRecord } from '../../types/profile';

interface CertificationsSectionProps {
  records: CertificationRecord[];
  onChange: (updated: CertificationRecord[]) => void;
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  records,
  onChange,
}) => {
  const handleAdd = () => {
    const newRecord: CertificationRecord = {
      id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: '',
      issuingOrg: '',
      issueYear: '',
      credentialUrl: '',
    };
    onChange([...records, newRecord]);
  };

  const handleRemove = (id: string) => {
    onChange(records.filter((rec) => rec.id !== id));
  };

  const handleUpdate = (id: string, field: keyof CertificationRecord, value: string) => {
    onChange(
      records.map((rec) => {
        if (rec.id === id) {
          return { ...rec, [field]: value };
        }
        return rec;
      })
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#E8E6F0] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F0EEFA] text-[#6558D9] border border-[#E0DDF0] flex items-center justify-center font-bold text-sm">
            6
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#20243A]">Certifications & Licenses</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F0EEFA] text-[#6558D9] border border-[#E8E6F0] tabular-nums">
                {records.length}
              </span>
            </div>
            <p className="text-xs text-[#73778C]">
              Add verified professional certificates (AWS, GCP, CKA, Meta, etc.).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4F46BA] bg-[#F0EEFA] hover:bg-[#EBE7F8] rounded-lg transition-colors border border-[#DCD8F0] self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Certification</span>
        </button>
      </div>

      {records.length === 0 ? (
        <div className="p-7 text-center border border-dashed border-[#DCD8F0] rounded-xl bg-[#F5F4FA]">
          <Award className="w-8 h-8 text-[#9E9EAF] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#20243A]">No certifications recorded</p>
          <p className="text-xs text-[#73778C] mt-1 max-w-sm mx-auto">
            Certifications authenticate specialized skills in cloud, security, or specific architectures.
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#6558D9] hover:bg-[#5346C8] rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Certification</span>
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
                  <Award className="w-3.5 h-3.5 text-[#6558D9]" />
                  Certificate #{index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemove(record.id)}
                  aria-label={`Remove certificate #${index + 1}`}
                  className="p-1 text-[#73778C] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Remove this certificate"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                {/* Certification Name */}
                <div className="sm:col-span-1 lg:col-span-5">
                  <label className="block text-xs font-semibold text-[#20243A] mb-1">
                    Certification Name
                  </label>
                  <input
                    type="text"
                    value={record.name}
                    onChange={(e) => handleUpdate(record.id, 'name', e.target.value)}
                    placeholder="e.g. AWS Certified Solutions Architect – Associate"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                  />
                </div>

                {/* Issuing Organization */}
                <div className="sm:col-span-1 lg:col-span-4">
                  <label className="block text-xs font-semibold text-[#20243A] mb-1">
                    Issuing Organization
                  </label>
                  <input
                    type="text"
                    value={record.issuingOrg}
                    onChange={(e) => handleUpdate(record.id, 'issuingOrg', e.target.value)}
                    placeholder="e.g. Amazon Web Services, Linux Foundation"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                  />
                </div>

                {/* Issue Year */}
                <div className="sm:col-span-1 lg:col-span-3">
                  <label className="block text-xs font-semibold text-[#20243A] mb-1">
                    Issue Year / Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={record.issueYear}
                      onChange={(e) => handleUpdate(record.id, 'issueYear', e.target.value)}
                      placeholder="e.g. 2024"
                      className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Optional Credential URL */}
                <div className="sm:col-span-2 lg:col-span-12">
                  <label className="block text-xs font-semibold text-[#20243A] mb-1">
                    Credential URL <span className="text-[#73778C] font-normal">(Optional validation link)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="url"
                      value={record.credentialUrl}
                      onChange={(e) => handleUpdate(record.id, 'credentialUrl', e.target.value)}
                      placeholder="https://www.credly.com/badges/..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
