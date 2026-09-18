const DOMAIN_NAMES: Record<string, string> = {
  "mckinsey.com": "McKinsey",
  "kpmg.com": "KPMG",
  "bcg.com": "BCG",
  "deloitte.com": "Deloitte",
  "pwc.com": "PwC",
  "adecco.com": "Adecco",
  "michaelpage.com.vn": "Michael Page",
  "mercer.com": "Mercer",
  "manpowergroup.com.vn": "ManpowerGroup",
  "robertwalters.com.vn": "Robert Walters",
  "hays.com.vn": "Hays",
  "vietnamworks.com": "VietnamWorks",
  "topcv.vn": "TopCV",
  "itviec.com": "ITviec",
  "careerlink.vn": "CareerLink",
  "indeed.com": "Indeed",
  "gso.gov.vn": "GSO (Tổng cục Thống kê)",
};

/** Human-readable publisher name for a source URL, falling back to its bare hostname. */
export function getSourceDisplayName(url: string): string {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
  for (const [domain, name] of Object.entries(DOMAIN_NAMES)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) return name;
  }
  return hostname;
}
