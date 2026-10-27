import { parseResumeFile, ParsedResume } from '../../api/resumeParser';
import { exportToRadixProfileJSON } from '../exportProfile';
import { profileToFormState } from '../profileAdapter';
import { INITIAL_EMPTY_PROFILE } from '../sampleData';
import { mergeParsedResume } from '../resumeAdapter';
import { SkillRecord, VALID_RADIX_CODES } from '../../types/profile';

let passed = 0;

function assert(description: string, condition: boolean): void {
  if (!condition) throw new Error(`FAIL: ${description}`);
  passed++;
  console.log(`PASS: ${description}`);
}

function resume(overrides: Partial<ParsedResume> = {}): ParsedResume {
  return {
    source_type: 'resume',
    source_file: 'sample.docx',
    candidate: { name: 'Jordan Rivera', email: 'jordan@example.test', phone: '+1 4158902341' },
    skills: [],
    education: [],
    projects: [],
    experience: [],
    certifications: [],
    preferred_roles: [],
    ...overrides,
  };
}

function expectReject(action: () => Promise<unknown>, message: RegExp): Promise<boolean> {
  return action().then(
    () => false,
    (error: unknown) => error instanceof Error && message.test(error.message),
  );
}

async function testAdapter(): Promise<void> {
  const allCodes = [...VALID_RADIX_CODES];
  const fullResult = mergeParsedResume(
    {
      ...INITIAL_EMPTY_PROFILE,
      cvFile: {
        file: new File(['resume bytes'], 'sample.docx'),
        fileName: 'sample.docx',
        fileSizeFormatted: '12 B',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        previewUrl: null,
        uploadedAt: 'test',
      },
    },
    resume({
      skills: allCodes.map((category_code) => ({
        skill_name: `skill-${category_code}`,
        category_code,
        evidence: 'Resume evidence',
        confidence: 'high',
      })),
      education: [
        {
          degree: 'B.Tech',
          field: 'Computer Science and Engineering',
          institution: '',
          start_year: null,
          end_year: '2026',
          cgpa: '8.6/10',
          grade: 'CGPA 8.6 / 10',
        },
        {
          degree: "Bachelor's Degree",
          field: 'Computer Science',
          institution: 'Test University',
          start_year: '2022',
          end_year: '2026',
          grade: null,
        },
        {
          degree: 'Diploma',
          field: '',
          institution: '',
          start_year: '2020',
          end_year: null,
          grade: 'A',
        },
      ],
      projects: [{ title: 'Resume Project', description: 'Built with TypeScript', technologies: ['TypeScript'] }],
      experience: [{
        company: 'Test Company',
        role: 'Developer',
        duration: 'Summer 2025',
        description: 'Built a web app',
        technologies: ['React'],
      }],
      certifications: ['Cloud Certificate'],
    }),
    'sample.docx',
  );
  assert('adapter maps candidate name, email, and international phone', fullResult.profile.personal.fullName === 'Jordan Rivera' && fullResult.profile.personal.email === 'jordan@example.test' && fullResult.profile.personal.phone === '4158902341' && fullResult.profile.personal.countryCode === '+1');
  assert('adapter maps Ananya resume education into the editable Role 3 education fields', fullResult.profile.education[0]?.degree === 'B.Tech' && fullResult.profile.education[0]?.fieldOfStudy === 'Computer Science and Engineering' && fullResult.profile.education[0]?.graduationYear === '2026' && fullResult.profile.education[0]?.institution === '');
  assert('adapter extracts an explicitly labeled CGPA into the education form field', fullResult.profile.education[0]?.cgpa === '8.6/10');
  const labeledCgpaResult = mergeParsedResume(
    INITIAL_EMPTY_PROFILE,
    resume({
      candidate: { name: '', email: '', phone: '' },
      education: [{
        degree: 'B.Tech',
        field: 'Computer Science and Engineering',
        institution: '',
        start_year: null,
        end_year: '2026',
        cgpa: 'CGPA 8.6 / 10',
        grade: 'CGPA 8.6 / 10',
      }],
    }),
    'Ananya Rao.pdf',
  );
  assert('adapter accepts the parser CGPA field with its label and maps it to the correct education record', labeledCgpaResult.profile.education.length === 1 && labeledCgpaResult.profile.education[0]?.degree === 'B.Tech' && labeledCgpaResult.profile.education[0]?.cgpa === '8.6/10');
  assert('adapter continues to report non-CGPA grades that have no matching profile field', fullResult.unmapped.some((item) => item.includes('grade "A"')) && !fullResult.unmapped.some((item) => item.includes('CGPA 8.6 / 10')));
  const cgpaPayload = exportToRadixProfileJSON(fullResult.profile);
  const reloadedCgpa = profileToFormState(cgpaPayload);
  assert('CGPA is included in the saved profile and restored when the profile is loaded', cgpaPayload.education[0]?.cgpa === '8.6/10' && reloadedCgpa.education[0]?.cgpa === '8.6/10');
  const legacyPayload = { ...cgpaPayload, education: cgpaPayload.education.map(({ cgpa: _cgpa, ...item }) => item) };
  assert('profiles saved before CGPA support load with a blank CGPA field', profileToFormState(legacyPayload).education[0]?.cgpa === '');
  const existingEducationProfile = {
    ...INITIAL_EMPTY_PROFILE,
    education: [{
      ...INITIAL_EMPTY_PROFILE.education[0],
      id: 'existing-education',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Science and Engineering',
      graduationYear: '2026',
      cgpa: '',
    }],
  };
  const parsedIntoExistingEducation = mergeParsedResume(
    existingEducationProfile,
    resume({
      candidate: { name: '', email: '', phone: '' },
      education: [{
        degree: 'B.Tech',
        field: 'Computer Science and Engineering',
        institution: '',
        start_year: null,
        end_year: '2026',
        grade: 'CGPA 8.6 / 10',
      }],
    }),
    'Ananya Rao.pdf',
  );
  assert('resume CGPA fills a matching existing education record without duplicating it', parsedIntoExistingEducation.profile.education.length === 1 && parsedIntoExistingEducation.profile.education[0]?.cgpa === '8.6/10' && parsedIntoExistingEducation.profile.education[0]?.id === 'existing-education');
  assert('adapter does not mislabel education start year as graduation year', fullResult.profile.education[2]?.graduationYear === '' && fullResult.unmapped.some((item) => item.includes('start year "2020"')));
  assert('adapter maps valid parsed skills directly into the editable profile', fullResult.profile.skills.length === allCodes.length && fullResult.profile.skills.every((skill) => allCodes.includes(skill.categoryCode) && skill.evidence === 'Resume evidence' && skill.confidence === 'high'));
  assert('adapter stores Role 2 projects as projects, not hackathons', fullResult.profile.hackathons[0]?.type === 'project' && fullResult.profile.hackathons[0]?.title === 'Resume Project');
  assert('adapter preserves parsed project technologies in the existing technology tags', fullResult.profile.hackathons[0]?.technologies.join(',') === 'TypeScript');
  assert('adapter maps parser experience into editable internship fields', fullResult.profile.internships[0]?.company === 'Test Company' && fullResult.profile.internships[0]?.role === 'Developer' && fullResult.profile.internships[0]?.description === 'Summer 2025 — Built a web app');
  assert('adapter maps text certifications without inventing issuer details', fullResult.profile.certifications[0]?.name === 'Cloud Certificate' && fullResult.profile.certifications[0]?.issuingOrg === '');
  assert('adapter preserves the selected file in browser memory and stores its filename for the shared contract', fullResult.profile.cvFile?.fileName === 'sample.docx' && fullResult.profile.cvFile.file instanceof File);

  const locationProfile = {
    ...INITIAL_EMPTY_PROFILE,
    personal: { ...INITIAL_EMPTY_PROFILE.personal, cityCountry: 'Delhi' },
  };
  const locationPayload = exportToRadixProfileJSON(locationProfile);
  const loadedLocation = profileToFormState(locationPayload);
  assert('City & Country is included in the save payload and restored when the profile is loaded', locationPayload.city_country === 'Delhi' && loadedLocation.personal.cityCountry === 'Delhi');

  const fixtureResult = mergeParsedResume(
    { ...INITIAL_EMPTY_PROFILE, preferredRoles: ['Data Analyst'] },
    resume({
      candidate: { name: '', email: '', phone: '' },
      projects: [
        {
          title: 'simple student attendance tracker',
          description: 'Built a simple student attendance tracker using Java and a MySQL backend for a college project',
          technologies: ['Java', 'MySQL'],
        },
        {
          title: 'college helpdesk simulation project',
          description: 'Contributed to a college helpdesk simulation project, resolving simulated tickets and logging resolutions',
          technologies: [],
        },
        {
          title: '12-hour campus hackathon',
          description: 'Participated (non-finalist)',
          technologies: [],
        },
      ],
      experience: [{
        company: 'a local business',
        role: 'Summer intern, IT support desk',
        duration: '',
        description: 'handled first-level troubleshooting and escalations',
        technologies: [],
      }],
      certifications: ['Cisco Networking Basics (online course)'],
      preferred_roles: ['Application Support Analyst', 'Associate Software Engineer'],
    }),
    'Priya Menon.pdf',
  );
  const helpdeskProject = fixtureResult.profile.hackathons.find(
    (item) => item.title === 'college helpdesk simulation project',
  );
  const attendanceProject = fixtureResult.profile.hackathons.find(
    (item) => item.title === 'simple student attendance tracker',
  );
  const campusHackathon = fixtureResult.profile.hackathons.find(
    (item) => item.type === 'hackathon',
  );
  assert('fixture project descriptions and titles populate the editable projects section', Boolean(
    helpdeskProject?.description.includes('resolving simulated tickets') &&
    attendanceProject?.description.includes('Java and a MySQL backend'),
  ));
  assert('fixture Java and MySQL are preserved as project technology tags', attendanceProject?.technologies.join(',') === 'Java,MySQL');
  assert('fixture hackathon participation populates a hackathon record without inventing a title', Boolean(
    campusHackathon?.name === '12-hour campus hackathon' &&
    campusHackathon.title === '' &&
    campusHackathon.description === 'Participated (non-finalist)',
  ));
  assert('fixture internship details populate editable role, company, and responsibility fields', Boolean(
    fixtureResult.profile.internships[0]?.company === 'a local business' &&
    fixtureResult.profile.internships[0]?.role === 'Summer intern, IT support desk' &&
    fixtureResult.profile.internships[0]?.description.includes('first-level troubleshooting'),
  ));
  assert('fixture certification populates its name without inventing issuer information', Boolean(
    fixtureResult.profile.certifications[0]?.name === 'Cisco Networking Basics (online course)' &&
    fixtureResult.profile.certifications[0]?.issuingOrg === 'Cisco',
  ));
  assert('fixture preferred roles populate standard and custom roles while preserving manual selection', fixtureResult.profile.preferredRoles.join(',') === 'Data Analyst,Application Support Analyst,Associate Software Engineer');
  const fixturePayload = exportToRadixProfileJSON(fixtureResult.profile);
  const hydratedFixture = profileToFormState(fixturePayload);
  assert('fixture project, hackathon, internship, and certification fields survive profile export and hydration', Boolean(
    hydratedFixture.hackathons.length === 3 &&
    hydratedFixture.hackathons.some((item) => item.type === 'hackathon' && item.name === '12-hour campus hackathon') &&
    hydratedFixture.internships[0]?.company === 'a local business' &&
    hydratedFixture.certifications[0]?.name === 'Cisco Networking Basics (online course)',
  ));

  const current = {
    ...INITIAL_EMPTY_PROFILE,
    personal: {
      ...INITIAL_EMPTY_PROFILE.personal,
      fullName: 'Entered Candidate',
      email: 'entered@example.test',
      phone: '9876543210',
      countryCode: '+91',
    },
    skills: [{
      id: 'existing',
      skillName: 'TypeScript',
      categoryCode: 'COD' as const,
      evidence: 'Entered evidence',
      confidence: 'medium' as const,
    }],
    cvFile: {
      file: null,
      fileName: 'sample.docx',
      fileSizeFormatted: '12 KB',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      previewUrl: null,
      uploadedAt: 'test',
    },
  };
  const conflictResult = mergeParsedResume(
    current,
    resume({
      candidate: { name: 'Parsed Candidate', email: 'parsed@example.test', phone: '+1 2125550123' },
      skills: [{ skill_name: 'typescript', category_code: 'COD', evidence: 'duplicate', confidence: 'high' }],
    }),
    'sample.docx',
  );
  assert('adapter preserves entered identity and reports name/email/phone conflicts', conflictResult.profile.personal.fullName === 'Entered Candidate' && conflictResult.conflicts.length === 3);
  assert('adapter preserves existing manual skills and deduplicates matching parser skills', conflictResult.profile.skills.length === 1 && conflictResult.profile.skills[0].evidence === 'Entered evidence');
  assert('adapter preserves the selected file and filename for the session', conflictResult.profile.cvFile?.fileName === 'sample.docx');

  const manualSkill: SkillRecord = {
    id: 'manual-dsa',
    skillName: 'DSA',
    categoryCode: 'COD',
    evidence: 'Entered manually',
    confidence: 'medium',
  };
  const manualProfile = { ...INITIAL_EMPTY_PROFILE, skills: [manualSkill] };
  const parsedResult = mergeParsedResume(
    manualProfile,
    resume({
      candidate: { name: '', email: '', phone: '' },
      skills: [
        { skill_name: 'Java', category_code: 'COD', evidence: 'Java', confidence: 'medium' },
        { skill_name: 'SQL', category_code: 'SQL', evidence: 'SQL', confidence: 'medium' },
        { skill_name: 'MySQL', category_code: 'SQL', evidence: 'MySQL', confidence: 'medium' },
        { skill_name: 'Oracle', category_code: 'SQL', evidence: 'Oracle', confidence: 'medium' },
        { skill_name: 'Networking', category_code: 'NETW', evidence: 'Networking', confidence: 'medium' },
        { skill_name: 'Cisco', category_code: 'NETW', evidence: 'Cisco', confidence: 'medium' },
        { skill_name: 'Linux', category_code: 'OS', evidence: 'Linux', confidence: 'medium' },
        { skill_name: 'java', category_code: 'COD', evidence: 'duplicate', confidence: 'high' },
        { skill_name: 'dsa', category_code: 'COD', evidence: 'duplicate manual skill', confidence: 'high' },
      ],
    }),
    'Priya Menon.pdf',
  );
  const parsedNames = parsedResult.profile.skills.map((skill) => skill.skillName);
  assert('parsing prefills the form with valid skills while preserving the existing manual skill', parsedResult.profile.skills.length === 8 && parsedNames.includes('DSA') && parsedNames.includes('Java') && parsedNames.includes('Linux'));
  assert('adapter deduplicates repeated parser skills and existing name/category pairs', parsedResult.profile.skills.filter((skill) => skill.skillName.toLowerCase() === 'java').length === 1 && parsedResult.profile.skills.filter((skill) => skill.skillName.toLowerCase() === 'dsa').length === 1);

  const savePayload = exportToRadixProfileJSON(parsedResult.profile);
  assert('save payload includes all parsed and manually entered active skills', savePayload.skills.length === 8);
  const loadedProfile = profileToFormState(savePayload);
  assert('profile hydration restores the same parsed and manually entered skills', loadedProfile.skills.length === savePayload.skills.length && loadedProfile.skills.map((skill) => skill.skillName).join(',') === savePayload.skills.map((skill) => skill.skill_name).join(','));

  const nullCandidate = mergeParsedResume(
    INITIAL_EMPTY_PROFILE,
    resume({ candidate: null, skills: [], education: [], projects: [], experience: [], certifications: [] }),
    'empty.pdf',
  );
  assert('adapter accepts null candidate and empty optional parser arrays', nullCandidate.profile.skills.length === 0 && nullCandidate.profile.education.length === 0);

  const malformed = mergeParsedResume(
    INITIAL_EMPTY_PROFILE,
    resume({
      candidate: { name: null, email: 12, phone: null },
      skills: [
        { skill_name: 'Unknown category', category_code: 'NOT_A_RADIX_CODE', evidence: '', confidence: 'certain' },
        { skill_name: '', category_code: 'COD', evidence: '', confidence: 'medium' },
      ],
      experience: [null as unknown as NonNullable<ParsedResume['experience']>[number]],
    }),
    'malformed.pdf',
  );
  assert('adapter surfaces malformed or unsupported skills rather than assigning a random category', malformed.profile.skills.length === 0 && malformed.unmapped.some((item) => item.includes('unsupported category')));
  assert('adapter reports malformed experience entries', malformed.unmapped.some((item) => item.includes('Experience item')));
}

async function testClient(): Promise<void> {
  const originalFetch = globalThis.fetch;
  const goodResult = resume({ candidate: null });
  try {
    let requestUrl = '';
    let requestInit: RequestInit | undefined;
    globalThis.fetch = async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify(goodResult), { status: 200 });
    };
    const parsed = await parseResumeFile(new File(['resume bytes'], 'resume.pdf', { type: 'application/pdf' }));
    assert('client sends supported PDF to the parser endpoint and accepts valid response', requestUrl === '/parser/parse-resume' && parsed.source_type === 'resume');
    assert('client sends multipart field file and leaves multipart boundary to fetch', requestInit?.body instanceof FormData && Boolean((requestInit.body as FormData).get('file')) && requestInit?.headers === undefined);

    assert('client rejects unsupported extension before sending', await expectReject(
      () => parseResumeFile(new File(['x'], 'resume.txt')),
      /PDF|DOCX/,
    ));
    assert('client rejects empty file before sending', await expectReject(
      () => parseResumeFile(new File([], 'empty.pdf')),
      /empty/,
    ));
    assert('client rejects files larger than 10 MB before sending', await expectReject(
      () => parseResumeFile(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.pdf')),
      /10 MB/,
    ));

    globalThis.fetch = async () => { throw new TypeError('network unavailable'); };
    assert('client provides an actionable parser-unavailable error', await expectReject(
      () => parseResumeFile(new File(['x'], 'resume.pdf')),
      /port 8002/,
    ));

    globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'Unsupported document' }), { status: 422 });
    assert('client surfaces non-2xx parser errors', await expectReject(
      () => parseResumeFile(new File(['x'], 'resume.pdf')),
      /Unsupported document/,
    ));

    globalThis.fetch = async () => new Response('', { status: 502, headers: { 'content-type': 'text/plain' } });
    assert('client identifies an empty Vite proxy 502 as an unavailable parser service', await expectReject(
      () => parseResumeFile(new File(['x'], 'resume.pdf')),
      /port 8002/,
    ));

    globalThis.fetch = async () => new Response('not json', { status: 200 });
    assert('client handles malformed JSON without crashing the UI', await expectReject(
      () => parseResumeFile(new File(['x'], 'resume.pdf')),
      /invalid response/,
    ));

    globalThis.fetch = async () => new Response(JSON.stringify({ skills: [] }), { status: 200 });
    assert('client rejects malformed response shape', await expectReject(
      () => parseResumeFile(new File(['x'], 'resume.pdf')),
      /expected format/,
    ));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function main(): Promise<void> {
  await testAdapter();
  await testClient();
  console.log(`\n=== RESUME PARSER TESTS: ${passed} PASSED ===`);
}

void main();
