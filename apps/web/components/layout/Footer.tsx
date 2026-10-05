import Link from "next/link";
import { ArrowUpRight, Mail, Rss } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { siteConfig } from "@/lib/metadata";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-grid">
        <div className="footer-brand-column">
          <Link href="/" className="site-brand">
            <BrandMark className="h-9 w-9" />
            <span>Doni Putra.</span>
          </Link>
          <p>
            Independent thinking.
            <br />
            Practical engineering.
          </p>
          <p className="footer-bio">
            {siteConfig.authorTagline}.
            <br />
            AWS, Fintech, Cloud &amp; AI. Based in Indonesia.
          </p>
          <div className="footer-socials">
            <a
              href="https://github.com/doni404"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub <ArrowUpRight size={14} />
            </a>
            <a
              href="https://www.linkedin.com/in/doniputra/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn <ArrowUpRight size={14} />
            </a>
            <a
              href="mailto:doniputrapurbawa@gmail.com"
              aria-label="Email"
              title="Email"
            >
              <Mail size={19} />
            </a>
          </div>
        </div>
        <div>
          <h2>Explore</h2>
          <ul>
            {[
              ["/", "Home"],
              ["/blogs", "Journal"],
              ["/projects", "Projects"],
              ["/about", "About"],
              ["/experience", "Experience"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-connect">
          <h2>Keep in touch</h2>
          <a href="mailto:doniputrapurbawa@gmail.com">
            doniputrapurbawa@gmail.com
          </a>
          <p>
            Open to remote opportunities
            <br />
            and Japan relocation.
          </p>
          <Link className="text-link" href="/contact">
            Start a conversation <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <div className="site-container footer-bottom">
        <span>&copy; {new Date().getFullYear()} Doni Putra Purbawa</span>
        <a href="/rss.xml">
          <Rss size={14} /> RSS feed
        </a>
        <span>Built with intention.</span>
      </div>
    </footer>
  );
}
