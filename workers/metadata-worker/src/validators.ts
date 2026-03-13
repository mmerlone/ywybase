class ValidationError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ValidationError'
    this.status = status
  }
}

function isIPv4(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0
}

function cidrContains(cidr: string, ip: string): boolean {
  const [range, bitsStr] = cidr.split('/')
  if (!range || !bitsStr) return false
  const bits = Number(bitsStr)
  if (!ip) return false
  const rangeInt = ipv4ToInt(range)
  const ipInt = ipv4ToInt(ip)
  const mask = bits === 0 ? 0 : ~((1 << (32 - bits)) - 1) >>> 0
  return (rangeInt & mask) === (ipInt & mask)
}

const BLOCKED_IP_CIDRS = [
  '127.0.0.0/8', // Loopback
  '10.0.0.0/8', // Private Class A
  '172.16.0.0/12', // Private Class B
  '192.168.0.0/16', // Private Class C
  '169.254.0.0/16', // Link-local
]

const BLOCKED_HOSTS = new Set(['localhost', '0.0.0.0'])

function isIPv6(host: string): boolean {
  // Bracketed IPv6 from URL.hostname or raw IPv6
  return host.includes(':')
}

const BLOCKED_IPV6_PREFIXES = [
  '::1', // Loopback
  '::ffff:', // IPv4-mapped
  'fc', // Unique local (fc00::/7)
  'fd', // Unique local (fc00::/7)
  'fe80:', // Link-local
]

/**
 * Validate a target URL and return a URL instance.
 * Throws ValidationError on invalid or disallowed targets (SSRF protection).
 * Checks performed:
 * - scheme must be http or https
 * - disallow well-known loopback and link-local hostnames
 * - disallow .local mDNS names
 * - disallow IPv4 literals in private CIDRs
 *
 * @param input Candidate URL string
 */
export function validateUrl(input: string): URL {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new ValidationError('Invalid URL', 400)
  }

  const protocol = url.protocol.replace(':', '')
  if (protocol !== 'http' && protocol !== 'https') {
    throw new ValidationError('Unsupported protocol', 400)
  }

  const host = url.hostname

  // Reject obvious blocked hostnames
  if (BLOCKED_HOSTS.has(host) || host === '127.0.0.1') {
    throw new ValidationError('Blocked host', 403)
  }

  if (host.endsWith('.local')) {
    // Log blocked attempt for observability
    // (logging skipped in sync context)
    throw new ValidationError('Blocked host (.local)', 403)
  }

  // If hostname is an IPv4 literal, check CIDRs and specific addresses
  if (isIPv4(host)) {
    // Specific blocked addresses
    if (host === '127.0.0.1' || host === '169.254.169.254' || host === '0.0.0.0') {
      throw new ValidationError('Blocked host', 403)
    }

    // Check CIDR ranges
    for (const cidr of BLOCKED_IP_CIDRS) {
      if (cidrContains(cidr, host)) {
        // (logging skipped in sync context)
        throw new ValidationError('Blocked IP range', 403)
      }
    }
  }

  // Block IPv6 loopback, private, and link-local
  if (isIPv6(host)) {
    const normalizedHost = host.replace(/^\[|\]$/g, '').toLowerCase()
    if (normalizedHost === '::1' || BLOCKED_IPV6_PREFIXES.some((p) => normalizedHost.startsWith(p))) {
      throw new ValidationError('Blocked IPv6 address', 403)
    }
  }

  // Note: cannot reliably resolve host -> IP in Workers synchronously here.
  // We block known hostnames and IP literals; additional protections should
  // be enforced at fetch time (e.g., validate final resolved IP) if possible.

  return url
}

export { ValidationError }
