import { TemplateLayout } from '@/lib/types/resume';
import Image from 'next/image';

interface TemplatePreviewProps {
  layout: TemplateLayout;
  color: string;
  sampleData: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    experience: Array<{ title: string; company: string; date: string; location?: string; description?: string }>;
    education: { degree: string; school: string; date: string; location?: string; description?: string };
    skills: string[];
    languages?: Array<{ name: string; proficiency: string }>;
    certifications?: Array<{ name: string; issuer: string; date: string }>;
    awards?: Array<{ title: string; issuer: string; date: string }>;
    websites?: Array<{ label: string; url: string }>;
    references?: Array<{ name: string; position: string; company: string; email: string; phone: string }>;
    hobbies?: string[];
  };
  showPhoto?: boolean;
}

export function TemplatePreviewRenderer({ layout, color, sampleData, showPhoto = false }: TemplatePreviewProps) {
  switch (layout) {
    case "sidebar":
      return (
        <div className="flex h-full">
          {/* Left Sidebar */}
          <div className="w-[35%] p-2" style={{ backgroundColor: color }}>
            {showPhoto && (
              <div className="h-8 w-8 mx-auto rounded-full overflow-hidden bg-white/30 mb-2">
                <Image src="/sample.png" alt="Profile" width={32} height={32} className="object-cover w-full h-full" />
              </div>
            )}
            <div className="text-center mb-3">
              <p className="text-[10px] font-bold text-white truncate">{sampleData.name}</p>
              <p className="text-[7px] text-white/80 truncate">{sampleData.title}</p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-[7px] font-bold text-white/90 uppercase mb-1">Contact</p>
                <p className="text-[6px] text-white/70 truncate">{sampleData.email}</p>
                <p className="text-[6px] text-white/70">{sampleData.phone}</p>
              </div>
              <div>
                <p className="text-[7px] font-bold text-white/90 uppercase mb-1">Skills</p>
                <div className="space-y-0.5">
                  {sampleData.skills.slice(0, 4).map((skill, i) => (
                    <p key={i} className="text-[6px] text-white/70">{skill}</p>
                  ))}
                </div>
              </div>
              {sampleData.languages && sampleData.languages.length > 0 && (
                <div>
                  <p className="text-[7px] font-bold text-white/90 uppercase mb-1">Languages</p>
                  <div className="space-y-0.5">
                    {sampleData.languages.slice(0, 3).map((lang, i) => (
                      <p key={i} className="text-[6px] text-white/70">{lang.name} - {lang.proficiency}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Right Content */}
          <div className="flex-1 p-2 bg-white">
            <div className="mb-2">
              <p className="text-[7px] font-bold uppercase mb-1" style={{ color }}>Experience</p>
              {sampleData.experience.slice(0, 2).map((exp, i) => (
                <div key={i} className="mb-1">
                  <p className="text-[7px] font-semibold text-zinc-800">{exp.title}</p>
                  <p className="text-[6px] text-zinc-500">{exp.company} • {exp.date}</p>
                  {exp.description && <p className="text-[5px] text-zinc-400 mt-0.5">{exp.description}</p>}
                </div>
              ))}
            </div>
            <div className="mb-2">
              <p className="text-[7px] font-bold uppercase mb-1" style={{ color }}>Education</p>
              <p className="text-[7px] font-semibold text-zinc-800">{sampleData.education.degree}</p>
              <p className="text-[6px] text-zinc-500">{sampleData.education.school}</p>
            </div>
            {sampleData.certifications && sampleData.certifications.length > 0 && (
              <div>
                <p className="text-[7px] font-bold uppercase mb-1" style={{ color }}>Certifications</p>
                {sampleData.certifications.slice(0, 2).map((cert, i) => (
                  <p key={i} className="text-[6px] text-zinc-500">{cert.name}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    
    case "modern":
      return (
        <div className="h-full bg-white p-3">
          {/* Header with accent */}
          <div className="mb-2 pb-2" style={{ borderBottom: `2px solid ${color}` }}>
            <div className="flex items-center gap-2 mb-1">
              {showPhoto && (
                <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-200 shrink-0">
                  <Image src="/sample.png" alt="Profile" width={40} height={40} className="object-cover w-full h-full" />
                </div>
              )}
              <div>
                <p className="text-[14px] font-bold text-zinc-800">{sampleData.name}</p>
                <p className="text-[9px] font-medium" style={{ color }}>{sampleData.title}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <p className="text-[6px] text-zinc-500">{sampleData.email}</p>
              <p className="text-[6px] text-zinc-500">{sampleData.phone}</p>
            </div>
          </div>
          {/* Two column layout */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[8px] font-bold uppercase mb-1" style={{ color }}>Experience</p>
              {sampleData.experience.slice(0, 2).map((exp, i) => (
                <div key={i} className="mb-1.5">
                  <p className="text-[8px] font-semibold text-zinc-800">{exp.title}</p>
                  <p className="text-[6px] text-zinc-600">{exp.company}</p>
                  <p className="text-[6px] text-zinc-400">{exp.date}</p>
                  {exp.description && <p className="text-[5px] text-zinc-500 mt-0.5">{exp.description}</p>}
                </div>
              ))}
              {sampleData.awards && sampleData.awards.length > 0 && (
                <div className="mt-2">
                  <p className="text-[8px] font-bold uppercase mb-1" style={{ color }}>Awards</p>
                  {sampleData.awards.slice(0, 2).map((award, i) => (
                    <p key={i} className="text-[6px] text-zinc-600">{award.title}</p>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase mb-1" style={{ color }}>Skills</p>
              <div className="flex flex-wrap gap-0.5">
                {sampleData.skills.slice(0, 6).map((skill, i) => (
                  <span key={i} className="text-[6px] px-1 py-0.5 rounded" style={{ backgroundColor: `${color}15`, color }}>{skill}</span>
                ))}
              </div>
              <p className="text-[8px] font-bold uppercase mt-2 mb-1" style={{ color }}>Education</p>
              <p className="text-[6px] font-semibold text-zinc-800">{sampleData.education.degree}</p>
              <p className="text-[6px] text-zinc-500">{sampleData.education.school}</p>
              {sampleData.languages && sampleData.languages.length > 0 && (
                <div className="mt-2">
                  <p className="text-[8px] font-bold uppercase mb-1" style={{ color }}>Languages</p>
                  <p className="text-[6px] text-zinc-600">{sampleData.languages.slice(0, 3).map(l => l.name).join(" • ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    
    case "bold":
      return (
        <div className="h-full bg-white">
          {/* Bold header */}
          <div className="p-3 text-white" style={{ backgroundColor: color }}>
            <div className="flex items-center gap-2">
              {showPhoto && (
                <div className="h-12 w-12 rounded-full overflow-hidden bg-white/20 shrink-0">
                  <Image src="/sample.png" alt="Profile" width={48} height={48} className="object-cover w-full h-full" />
                </div>
              )}
              <div>
                <p className="text-[16px] font-black uppercase tracking-wide">{sampleData.name}</p>
                <p className="text-[9px] font-medium opacity-90">{sampleData.title}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <div className="flex gap-3 mb-2 text-[6px] text-zinc-500">
              <span>{sampleData.email}</span>
              <span>{sampleData.phone}</span>
            </div>
            <div className="mb-2">
              <p className="text-[9px] font-black uppercase mb-1" style={{ color }}>Experience</p>
              {sampleData.experience.slice(0, 2).map((exp, i) => (
                <div key={i} className="mb-1">
                  <p className="text-[8px] font-bold text-zinc-800">{exp.title}</p>
                  <p className="text-[6px] text-zinc-500">{exp.company} | {exp.date}</p>
                  {exp.description && <p className="text-[5px] text-zinc-400 mt-0.5">{exp.description}</p>}
                </div>
              ))}
            </div>
            <div className="mb-2">
              <p className="text-[9px] font-black uppercase mb-1" style={{ color }}>Skills</p>
              <div className="flex flex-wrap gap-0.5">
                {sampleData.skills.slice(0, 5).map((skill, i) => (
                  <span key={i} className="text-[6px] px-1 py-0.5 bg-zinc-100 rounded font-medium">{skill}</span>
                ))}
              </div>
            </div>
            {sampleData.websites && sampleData.websites.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase mb-1" style={{ color }}>Links</p>
                {sampleData.websites.slice(0, 2).map((web, i) => (
                  <p key={i} className="text-[6px] text-zinc-600">{web.label}: {web.url}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    
    case "minimal":
      return (
        <div className="h-full bg-white p-3">
          <div className="text-center mb-2">
            {showPhoto && (
              <div className="h-10 w-10 mx-auto rounded-full overflow-hidden bg-zinc-200 mb-1">
                <Image src="/sample.png" alt="Profile" width={40} height={40} className="object-cover w-full h-full" />
              </div>
            )}
            <p className="text-[14px] font-semibold text-zinc-800">{sampleData.name}</p>
            <p className="text-[8px] text-zinc-500">{sampleData.title}</p>
            <div className="flex justify-center gap-2 mt-1 text-[6px] text-zinc-400">
              <span>{sampleData.email}</span>
              <span>•</span>
              <span>{sampleData.phone}</span>
            </div>
          </div>
          <div className="border-t border-zinc-200 pt-2 mb-2">
            <p className="text-[8px] font-semibold text-zinc-700 uppercase tracking-wide mb-1">Experience</p>
            {sampleData.experience.slice(0, 2).map((exp, i) => (
              <div key={i} className="mb-1 flex justify-between">
                <div>
                  <p className="text-[8px] font-medium text-zinc-800">{exp.title}</p>
                  <p className="text-[6px] text-zinc-500">{exp.company}</p>
                  {exp.description && <p className="text-[5px] text-zinc-400 mt-0.5">{exp.description}</p>}
                </div>
                <p className="text-[6px] text-zinc-400">{exp.date}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-200 pt-2 mb-2">
            <p className="text-[8px] font-semibold text-zinc-700 uppercase tracking-wide mb-1">Skills</p>
            <p className="text-[6px] text-zinc-600">{sampleData.skills.slice(0, 6).join(" • ")}</p>
          </div>
          {sampleData.certifications && sampleData.certifications.length > 0 && (
            <div className="border-t border-zinc-200 pt-2">
              <p className="text-[8px] font-semibold text-zinc-700 uppercase tracking-wide mb-1">Certifications</p>
              {sampleData.certifications.slice(0, 2).map((cert, i) => (
                <p key={i} className="text-[6px] text-zinc-600">{cert.name} - {cert.issuer}</p>
              ))}
            </div>
          )}
        </div>
      );
    
    case "executive":
      return (
        <div className="h-full bg-white p-3">
          <div className="border-b-2 pb-2 mb-2" style={{ borderColor: color }}>
            <div className="flex items-center gap-3">
              {showPhoto && (
                <div className="h-12 w-12 rounded-full overflow-hidden bg-zinc-200 shrink-0">
                  <Image src="/sample.png" alt="Profile" width={48} height={48} className="object-cover w-full h-full" />
                </div>
              )}
              <div>
                <p className="text-[16px] font-bold text-zinc-800 tracking-tight">{sampleData.name}</p>
                <p className="text-[9px] font-medium text-zinc-600">{sampleData.title}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mb-2 text-[6px] text-zinc-500">
            <span>{sampleData.location}</span>
            <span>{sampleData.email}</span>
            <span>{sampleData.phone}</span>
          </div>
          <div className="mb-2">
            <p className="text-[6px] text-zinc-600 leading-relaxed">{sampleData.summary}</p>
          </div>
          <div className="mb-2">
            <p className="text-[8px] font-bold uppercase mb-1" style={{ color }}>Professional Experience</p>
            {sampleData.experience.slice(0, 2).map((exp, i) => (
              <div key={i} className="mb-1">
                <div className="flex justify-between">
                  <p className="text-[8px] font-semibold text-zinc-800">{exp.title}</p>
                  <p className="text-[6px] text-zinc-500">{exp.date}</p>
                </div>
                <p className="text-[6px] text-zinc-600">{exp.company}</p>
                {exp.description && <p className="text-[5px] text-zinc-500 mt-0.5">{exp.description}</p>}
              </div>
            ))}
          </div>
          {sampleData.awards && sampleData.awards.length > 0 && (
            <div className="mb-2">
              <p className="text-[8px] font-bold uppercase mb-1" style={{ color }}>Awards & Honors</p>
              {sampleData.awards.slice(0, 2).map((award, i) => (
                <p key={i} className="text-[6px] text-zinc-600">{award.title} - {award.issuer}</p>
              ))}
            </div>
          )}
        </div>
      );
    
    case "harvard":
      return (
        <div className="h-full bg-white p-3">
          {/* Harvard Header - Name centered, contact below */}
          <div className="text-center mb-2 pb-1 border-b border-zinc-900">
            {showPhoto && (
              <div className="h-10 w-10 mx-auto rounded-full overflow-hidden bg-zinc-200 mb-1">
                <Image src="/sample.png" alt="Profile" width={40} height={40} className="object-cover w-full h-full" />
              </div>
            )}
            <p className="text-[18px] font-bold text-zinc-900 tracking-wide">{sampleData.name}</p>
            <div className="flex justify-center gap-2 mt-0.5 text-[6px] text-zinc-600">
              <span>{sampleData.location}</span>
              <span>|</span>
              <span>{sampleData.phone}</span>
              <span>|</span>
              <span>{sampleData.email}</span>
            </div>
          </div>
          {/* Education Section - Harvard style puts education first */}
          <div className="mb-2">
            <p className="text-[8px] font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-300 pb-0.5 mb-1">Education</p>
            <div className="flex justify-between">
              <div>
                <p className="text-[8px] font-bold text-zinc-800">{sampleData.education.school}</p>
                <p className="text-[6px] text-zinc-600 italic">{sampleData.education.degree}</p>
              </div>
              <p className="text-[6px] text-zinc-600">{sampleData.education.date}</p>
            </div>
          </div>
          {/* Experience Section */}
          <div className="mb-2">
            <p className="text-[8px] font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-300 pb-0.5 mb-1">Experience</p>
            {sampleData.experience.slice(0, 2).map((exp, i) => (
              <div key={i} className="mb-1">
                <div className="flex justify-between">
                  <p className="text-[8px] font-bold text-zinc-800">{exp.company}</p>
                  <p className="text-[6px] text-zinc-600">{exp.date}</p>
                </div>
                <p className="text-[6px] text-zinc-600 italic">{exp.title}</p>
                {exp.description && <p className="text-[5px] text-zinc-500 mt-0.5">{exp.description}</p>}
              </div>
            ))}
          </div>
          {/* Skills Section */}
          <div className="mb-2">
            <p className="text-[8px] font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-300 pb-0.5 mb-1">Skills & Languages</p>
            <p className="text-[6px] text-zinc-600"><span className="font-semibold">Skills:</span> {sampleData.skills.slice(0, 6).join(", ")}</p>
            {sampleData.languages && sampleData.languages.length > 0 && (
              <p className="text-[6px] text-zinc-600 mt-0.5"><span className="font-semibold">Languages:</span> {sampleData.languages.map(l => `${l.name} (${l.proficiency})`).join(", ")}</p>
            )}
          </div>
          {sampleData.certifications && sampleData.certifications.length > 0 && (
            <div>
              <p className="text-[8px] font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-300 pb-0.5 mb-1">Certifications</p>
              {sampleData.certifications.slice(0, 2).map((cert, i) => (
                <p key={i} className="text-[6px] text-zinc-600">{cert.name} - {cert.issuer} ({cert.date})</p>
              ))}
            </div>
          )}
        </div>
      );
    
    case "classic":
    default:
      return (
        <div className="h-full bg-white p-3" style={{ borderTop: `3px solid ${color}` }}>
          <div className="text-center mb-2">
            {showPhoto && (
              <div className="h-10 w-10 mx-auto rounded-full overflow-hidden bg-zinc-200 mb-1">
                <Image src="/sample.png" alt="Profile" width={40} height={40} className="object-cover w-full h-full" />
              </div>
            )}
            <p className="text-[14px] font-bold uppercase tracking-wide" style={{ color }}>{sampleData.name}</p>
            <p className="text-[8px] text-zinc-600">{sampleData.title}</p>
            <div className="flex justify-center gap-2 mt-1 text-[6px] text-zinc-500">
              <span>{sampleData.email}</span>
              <span>|</span>
              <span>{sampleData.phone}</span>
              <span>|</span>
              <span>{sampleData.location}</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-[8px] font-bold uppercase border-b pb-0.5 mb-1" style={{ color, borderColor: color }}>Experience</p>
            {sampleData.experience.slice(0, 2).map((exp, i) => (
              <div key={i} className="mb-1">
                <div className="flex justify-between">
                  <p className="text-[8px] font-semibold text-zinc-800">{exp.title}</p>
                  <p className="text-[6px] text-zinc-500">{exp.date}</p>
                </div>
                <p className="text-[6px] text-zinc-600">{exp.company}</p>
                {exp.description && <p className="text-[5px] text-zinc-400 mt-0.5">{exp.description}</p>}
              </div>
            ))}
          </div>
          <div className="mb-2">
            <p className="text-[8px] font-bold uppercase border-b pb-0.5 mb-1" style={{ color, borderColor: color }}>Education</p>
            <p className="text-[8px] font-semibold text-zinc-800">{sampleData.education.degree}</p>
            <p className="text-[6px] text-zinc-600">{sampleData.education.school} • {sampleData.education.date}</p>
          </div>
          <div className="mb-2">
            <p className="text-[8px] font-bold uppercase border-b pb-0.5 mb-1" style={{ color, borderColor: color }}>Skills</p>
            <div className="flex flex-wrap gap-0.5">
              {sampleData.skills.slice(0, 6).map((skill, i) => (
                <span key={i} className="text-[6px] px-1 py-0.5 bg-zinc-100 rounded">{skill}</span>
              ))}
            </div>
          </div>
          {sampleData.hobbies && sampleData.hobbies.length > 0 && (
            <div>
              <p className="text-[8px] font-bold uppercase border-b pb-0.5 mb-1" style={{ color, borderColor: color }}>Interests</p>
              <p className="text-[6px] text-zinc-600">{sampleData.hobbies.slice(0, 4).join(" • ")}</p>
            </div>
          )}
        </div>
      );
  }
}
