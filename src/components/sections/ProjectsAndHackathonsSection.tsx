import React, { useState } from 'react';
import { Trophy, Rocket, Plus, Trash2, Calendar, Tag } from 'lucide-react';
import { HackathonProjectRecord } from '../../types/profile';

interface ProjectsAndHackathonsSectionProps {
  records: HackathonProjectRecord[];
  onChange: (updated: HackathonProjectRecord[]) => void;
}

export const ProjectsAndHackathonsSection: React.FC<ProjectsAndHackathonsSectionProps> = ({
  records,
  onChange,
}) => {
  const [techInputs, setTechInputs] = useState<{ [id: string]: string }>({});

  const handleAdd = (type: 'hackathon' | 'project') => {
    const newRecord: HackathonProjectRecord = {
      id: `hp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      name: '',
      title: '',
      description: '',
      technologies: [],
      dateOrYear: '',
    };
    onChange([...records, newRecord]);
  };

  const handleRemove = (id: string) => {
    onChange(records.filter((rec) => rec.id !== id));
  };

  const handleUpdate = (id: string, field: keyof HackathonProjectRecord, value: any) => {
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
            4
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#20243A]">Hackathons & Projects</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F0EEFA] text-[#6558D9] border border-[#E8E6F0] tabular-nums">
                {records.length}
              </span>
            </div>
            <p className="text-xs text-[#73778C]">
              Demonstrate applied problem-solving, open-source work, and hackathon accomplishments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleAdd('hackathon')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8B5812] bg-[#FDF6E8] hover:bg-[#FBEED3] rounded-lg transition-colors border border-[#F4E3BF]"
          >
            <Trophy className="w-3.5 h-3.5 text-[#B87A1E]" />
            <span>+ Hackathon</span>
          </button>
          <button
            type="button"
            onClick={() => handleAdd('project')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4F46BA] bg-[#F0EEFA] hover:bg-[#EBE7F8] rounded-lg transition-colors border border-[#DCD8F0]"
          >
            <Rocket className="w-3.5 h-3.5 text-[#6558D9]" />
            <span>+ Project</span>
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="p-7 text-center border border-dashed border-[#DCD8F0] rounded-xl bg-[#F5F4FA]">
          <Rocket className="w-8 h-8 text-[#9E9EAF] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#20243A]">No hackathons or projects logged yet</p>
          <p className="text-xs text-[#73778C] mt-1 max-w-sm mx-auto">
            Practical projects give concrete evidence of your execution capability.
          </p>
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleAdd('hackathon')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#8B5812] bg-[#FDF6E8] hover:bg-[#FBEED3] border border-[#F4E3BF] rounded-lg transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              Add Hackathon
            </button>
            <button
              type="button"
              onClick={() => handleAdd('project')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#4F46BA] bg-[#F0EEFA] hover:bg-[#EBE7F8] border border-[#DCD8F0] rounded-lg transition-colors"
            >
              <Rocket className="w-3.5 h-3.5" />
              Add Project
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record, index) => (
            <div
              key={record.id}
              className="p-5 rounded-xl border border-[#E8E6F0] bg-[#F5F4FA]/70 relative hover:border-[#DCD8F0] transition-colors"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                      record.type === 'hackathon'
                        ? 'bg-[#FDF6E8] text-[#8B5812] border-[#F4E3BF]'
                        : 'bg-[#F0EEFA] text-[#4F46BA] border-[#DCD8F0]'
                    }`}
                  >
                    {record.type === 'hackathon' ? (
                      <Trophy className="w-3 h-3 text-[#B87A1E]" />
                    ) : (
                      <Rocket className="w-3 h-3 text-[#6558D9]" />
                    )}
                    {record.type === 'hackathon' ? 'Hackathon' : 'Independent Project'}
                  </span>
                  <span className="text-xs text-[#73778C]">#{index + 1}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdate(
                        record.id,
                        'type',
                        record.type === 'hackathon' ? 'project' : 'hackathon'
                      )
                    }
                    className="text-xs text-[#73778C] hover:text-[#20243A] underline underline-offset-2 transition-colors"
                  >
                    Switch to {record.type === 'hackathon' ? 'Project' : 'Hackathon'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(record.id)}
                    aria-label={`Remove ${record.type} entry #${index + 1}`}
                    className="p-1 text-[#73778C] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Remove this entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                {/* Event Name or Org */}
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-[#20243A] mb-1">
                    {record.type === 'hackathon' ? 'Hackathon Name' : 'Context / Affiliation'}
                  </label>
                  <input
                    type="text"
                    value={record.name}
                    onChange={(e) => handleUpdate(record.id, 'name', e.target.value)}
                    placeholder={
                      record.type === 'hackathon'
                        ? 'e.g. RADIX Hackathon 2026, MIT Battlecode'
                        : 'e.g. Open Source, Personal Capstone'
                    }
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                  />
                </div>

                {/* Project Title */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-[#20243A] mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={record.title}
                    onChange={(e) => handleUpdate(record.id, 'title', e.target.value)}
                    placeholder="e.g. Real-Time Distributed Task Engine"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                  />
                </div>

                {/* Date or Year */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-[#20243A] mb-1">
                    Date / Year <span className="text-[#73778C] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#73778C]">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={record.dateOrYear}
                      onChange={(e) => handleUpdate(record.id, 'dateOrYear', e.target.value)}
                      placeholder="e.g. Fall 2025"
                      className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-[#20243A] mb-1">
                  What did you build or accomplish?
                </label>
                <textarea
                  rows={2}
                  value={record.description}
                  onChange={(e) => handleUpdate(record.id, 'description', e.target.value)}
                  placeholder="Detail the architecture, your specific contributions, challenges solved, or awards won..."
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#E8E6F0] focus:border-[#6558D9] focus:ring-3 focus:ring-[#6558D9]/10 bg-white text-[#20243A] placeholder-[#9E9EAF] focus:outline-none"
                />
              </div>

              {/* Technologies Used */}
              <div>
                <label className="block text-xs font-semibold text-[#20243A] mb-1">
                  Technologies & Frameworks
                </label>

                {/* Tag Pills */}
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
                      placeholder="Add technologies (press Enter or comma separated, e.g. React, Node.js)"
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
