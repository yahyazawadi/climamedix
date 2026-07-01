import { useEffect, useRef } from 'preact/hooks';
import { Button } from '../../../shared/components/Button';
import { GlassCard } from '../../../shared/components/GlassCard';

export function CertificateGenerator({ recipientName = 'د. مريم العتيبي', courseTitle = 'زمالة طب الكوارث المناخية والبيئية', onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set Dimensions (high res for certificate print)
    canvas.width = 800;
    canvas.height = 560;

    // Draw Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 560);
    bgGrad.addColorStop(0, '#f7fbfc');
    bgGrad.addColorStop(1, '#e9f3f7');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 560);

    // Draw Decorative Borders
    ctx.strokeStyle = '#0b2849';
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, 760, 520);

    ctx.strokeStyle = '#15b47a';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 740, 500);

    // Draw Corner Accents
    ctx.fillStyle = '#0b2849';
    // Top Left
    ctx.fillRect(20, 20, 40, 40);
    // Top Right
    ctx.fillRect(740, 20, 40, 40);
    // Bottom Left
    ctx.fillRect(20, 500, 40, 40);
    // Bottom Right
    ctx.fillRect(740, 500, 40, 40);

    // Write Text Content
    ctx.textAlign = 'center';
    
    // Header
    ctx.fillStyle = '#0b2849';
    ctx.font = 'bold 20px "Tajawal", "Outfit", sans-serif';
    ctx.fillText('أكاديمية كلايما ميدكس للمناخ والصحة', 400, 85);
    ctx.font = '12px "Tajawal", "Outfit", sans-serif';
    ctx.fillText('CLIMAMEDIX ACADEMY FOR CLIMATE & HEALTH', 400, 105);

    // Main Certificate Title
    ctx.fillStyle = '#15b47a';
    ctx.font = 'bold 36px "Tajawal", sans-serif';
    ctx.fillText('شهادة إتمام معتمدة', 400, 170);

    // Certificate Body
    ctx.fillStyle = '#0b2849';
    ctx.font = '16px "Tajawal", sans-serif';
    ctx.fillText('تشهد الأكاديمية بأن الباحث / الممارس الصحي', 400, 230);

    // Recipient Name
    ctx.fillStyle = '#004c6d';
    ctx.font = 'bold 28px "Tajawal", sans-serif';
    ctx.fillText(recipientName, 400, 280);

    // Course Body
    ctx.fillStyle = '#0b2849';
    ctx.font = '16px "Tajawal", sans-serif';
    ctx.fillText('قد أكمل بنجاح متطلبات المساق التدريبي التخصصي:', 400, 335);

    // Course Title
    ctx.fillStyle = '#0b2849';
    ctx.font = 'bold 20px "Tajawal", sans-serif';
    ctx.fillText(courseTitle, 400, 380);

    // Date
    const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillStyle = 'rgba(11, 40, 73, 0.6)';
    ctx.font = '13px "Tajawal", sans-serif';
    ctx.fillText(`تاريخ الإصدار: ${today}`, 400, 435);

    // Signature Area
    ctx.strokeStyle = 'rgba(11, 40, 73, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 485);
    ctx.lineTo(280, 485);
    ctx.stroke();

    ctx.fillStyle = '#0b2849';
    ctx.font = '12px "Tajawal", sans-serif';
    ctx.fillText('مدير التدريب الأكاديمي', 215, 500);

    // Seal Area (Gold circular drawing)
    ctx.beginPath();
    ctx.arc(580, 475, 30, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(21, 180, 122, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#15b47a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#15b47a';
    ctx.font = 'bold 10px "Tajawal", sans-serif';
    ctx.fillText('SEAL', 580, 478);

  }, [recipientName, courseTitle]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `شهادة_كلايما_ميدكس_${recipientName.replace(/\s+/g, '_')}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 12, 26, 0.6)',
      backdropFilter: 'blur(15px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <GlassCard style={{ padding: '30px', maxWidth: '850px', width: '100%', direction: 'rtl', textAlign: 'center', background: '#ffffff' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(11,40,73,0.1)', paddingBottom: '12px', marginBottom: '20px' }}>
          <h4 style={{ color: '#0b2849', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>مولد الشهادات الرقمي</h4>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#ff4d4d' }}>&times;</button>
          )}
        </div>

        {/* Certificate Display Area */}
        <div style={{ overflowX: 'auto', marginBottom: '25px', display: 'flex', justifyContent: 'center' }}>
          <canvas 
            ref={canvasRef} 
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              borderRadius: '12px', 
              boxShadow: '0 12px 36px rgba(11, 40, 73, 0.15)',
              border: '1px solid rgba(11, 40, 73, 0.1)'
            }} 
          />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <Button 
            variant="gradient" 
            onClick={handleDownload}
            style={{ padding: '12px 30px', fontSize: '13.5px' }}
          >
            تحميل الشهادة بصيغة PNG
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            style={{ padding: '12px 30px', fontSize: '13.5px', borderColor: '#004c6d', color: '#004c6d' }}
          >
            إغلاق النافذة
          </Button>
        </div>

      </GlassCard>
    </div>
  );
}
