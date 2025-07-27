import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Send,
  CheckCircle,
  ArrowLeft
} from "lucide-react";

const ContactSection = () => {
  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-cairo font-bold text-4xl md:text-5xl text-foreground mb-6">
                تواصل معنا الآن
              </h2>
              <p className="font-tajawal text-xl text-muted-foreground">
                جاهزين نساعدك تطلق مطعمك للمرحلة الجاية. تواصل معنا واحصل على استشارة مجانية
              </p>
            </div>

            {/* Contact Options */}
            <div className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-cairo font-bold text-foreground">واتساب</h3>
                      <p className="font-tajawal text-muted-foreground">للرد السريع والدعم المباشر</p>
                    </div>
                    <Button 
                      className="bg-success hover:bg-success/90 text-white font-cairo"
                      onClick={() => window.open('https://wa.me/966500000000', '_blank')}
                    >
                      تواصل
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-cairo font-bold text-foreground">هاتف</h3>
                      <p className="font-tajawal text-muted-foreground">920000000</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-cairo"
                      onClick={() => window.location.href = 'tel:920000000'}
                    >
                      اتصل الآن
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-card hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-cairo font-bold text-foreground">إيميل</h3>
                      <p className="font-tajawal text-muted-foreground">info@menutech.sa</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-2 border-accent text-accent hover:bg-accent hover:text-white font-cairo"
                      onClick={() => window.location.href = 'mailto:info@menutech.sa'}
                    >
                      راسلنا
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <h3 className="font-cairo font-bold text-xl text-foreground">ليش تختارنا؟</h3>
              {[
                "إعداد مجاني ودعم كامل",
                "تصميم احترافي يناسب مطعمك",
                "دعم فني 24/7",
                "أسعار تنافسية وباقات مرنة"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-tajawal text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <Card className="bg-white shadow-elegant border-0">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="font-cairo font-bold text-2xl text-foreground mb-2">
                  احصل على استشارة مجانية
                </h3>
                <p className="font-tajawal text-muted-foreground">
                  اترك بياناتك وهنتواصل معك خلال 24 ساعة
                </p>
              </div>

              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-cairo font-semibold text-foreground block mb-2">
                      الاسم *
                    </label>
                    <Input 
                      placeholder="أدخل اسمك" 
                      className="font-tajawal text-right border-2 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="font-cairo font-semibold text-foreground block mb-2">
                      رقم الجوال *
                    </label>
                    <Input 
                      placeholder="05xxxxxxxx" 
                      className="font-tajawal text-right border-2 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-cairo font-semibold text-foreground block mb-2">
                    اسم المطعم
                  </label>
                  <Input 
                    placeholder="أدخل اسم مطعمك" 
                    className="font-tajawal text-right border-2 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-cairo font-semibold text-foreground block mb-2">
                    الرسالة
                  </label>
                  <Textarea 
                    placeholder="أخبرنا عن احتياجاتك أو أي أسئلة تود طرحها..." 
                    rows={4}
                    className="font-tajawal text-right border-2 focus:border-primary resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary text-white font-cairo font-bold text-lg py-6 rounded-xl hover:shadow-glow transition-all duration-300"
                >
                  إرسال الطلب
                  <Send className="w-5 h-5 mr-2" />
                </Button>

                <p className="text-center font-tajawal text-sm text-muted-foreground">
                  بإرسال هذا النموذج، أنت توافق على 
                  <span className="text-primary cursor-pointer"> شروط الاستخدام </span>
                  و
                  <span className="text-primary cursor-pointer"> سياسة الخصوصية</span>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;