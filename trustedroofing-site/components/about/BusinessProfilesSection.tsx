import { activeBusinessProfiles } from "@/data/businessProfiles";
import PageContainer from "@/components/ui/PageContainer";
import styles from "./BusinessProfilesSection.module.css";

export default function BusinessProfilesSection() {
  return (
    <section className="ui-page-section ui-page-section--soft" aria-labelledby="business-profiles-heading">
      <PageContainer>
        <p className="homev3-eyebrow">Independent business references</p>
        <h2 id="business-profiles-heading">Trusted Roofing & Exteriors Around the Web</h2>
        <p>
          Trusted Roofing & Exteriors maintains business profiles and listings across contractor, social,
          local business and directory platforms. The active profiles below reference the same Calgary
          roofing and exterior business represented on this website.
        </p>
        <div className={styles.grid}>
          {activeBusinessProfiles.map((profile) => (
            <article className={`ui-card ${styles.card}`} key={profile.id}>
              <span className={styles.type}>{profile.type}</span>
              <h3>{profile.name}</h3>
              <p>{profile.description}</p>
              <a className={styles.link} href={profile.url} target="_blank" rel="noopener noreferrer">
                Trusted Roofing & Exteriors on {profile.name}
              </a>
            </article>
          ))}
        </div>
        <article className={`ui-card ${styles.explanation}`}>
          <h2>About These Business Profiles</h2>
          <p>
            These third-party profiles provide additional references to the same Trusted Roofing & Exteriors
            business across social, contractor, Calgary and Alberta business platforms. Listing details are
            maintained by their respective platforms and may be updated independently of this website.
          </p>
        </article>
      </PageContainer>
    </section>
  );
}

