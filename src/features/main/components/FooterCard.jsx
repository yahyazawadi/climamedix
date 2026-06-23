import footerLogo from '../../../assets/footer_logo.svg'
import socialIn from '../../../assets/social_in.svg'
import socialFb from '../../../assets/social_fb.svg'
import socialInsta from '../../../assets/social_insta.svg'
import socialX from '../../../assets/social_x.svg'
import contactMail from '../../../assets/contact_mail.svg'
import contactPhone from '../../../assets/contact_phone.svg'
import contactWeb from '../../../assets/contact_web.svg'

export function FooterCard({ lang }) {
  return (
    <div class="figma-footer-card">
      <div class="figma-footer-logo-wrap">
        <img src={footerLogo} alt="كلايما ميدكس" />
      </div>
      
      <div class="figma-footer-section">
        <span class="figma-section-title">
          {lang === 'ar' ? 'تابعونا على مواقع التواصل الاجتماعي:' : 'Follow us on social media:'}
        </span>
        <div class="figma-social-row">
          <a href="#" aria-label="Facebook"><img src={socialFb} alt="Facebook" /></a>
          <a href="#" aria-label="LinkedIn"><img src={socialIn} alt="LinkedIn" /></a>
          <a href="#" aria-label="Instagram"><img src={socialInsta} alt="Instagram" /></a>
          <a href="#" aria-label="Twitter"><img src={socialX} alt="Twitter" /></a>
        </div>
      </div>

      <div class="figma-footer-section">
        <span class="figma-section-title">
          {lang === 'ar' ? 'تواصلوا معنا:' : 'Contact us:'}
        </span>
        <div class="figma-contact-row">
          <a href="mailto:info@climamedix.org" aria-label="Email"><img src={contactMail} alt="Email" /></a>
          <a href="https://www.climamedix.org" target="_blank" rel="noopener noreferrer" aria-label="Website"><img src={contactWeb} alt="Website" /></a>
          <a href="tel:+970599123456" aria-label="Phone"><img src={contactPhone} alt="Phone" /></a>
        </div>
      </div>
    </div>
  );
}
