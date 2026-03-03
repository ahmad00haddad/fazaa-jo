import { motion } from "framer-motion";
import heroImage from "@/assets/hero-illustration.png";
import fazaaLogo from "@/assets/fazaa-logo.png";
import { Phone, MessageCircle, MapPin, Plus, Heart, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={fazaaLogo} alt="Fazaa" className="w-9 h-9 rounded-xl" />
            <span className="font-display font-bold text-xl text-foreground">FAZAA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-body text-sm text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
          </div>
          <Button variant="default" size="sm">Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full gradient-hero opacity-10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full gradient-accent opacity-10 blur-3xl" />
        </div>
        <div className="container grid lg:grid-cols-2 gap-12 items-center relative">
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium font-body">
                Community Help App
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] text-foreground"
            >
              Help is just
              <br />
              <span className="gradient-hero bg-clip-text text-transparent">one tap</span> away
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-muted-foreground max-w-lg font-body leading-relaxed"
            >
              Fazaa connects people who need help with those ready to answer the call. Whether your car breaks down, you need medicine, or anything in between — your community has your back.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex gap-4">
              <Button size="lg" className="font-display text-base">
                Ask for Fazaa
              </Button>
              <Button size="lg" variant="outline" className="font-display text-base">
                Learn More
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 gradient-hero rounded-3xl opacity-20 blur-2xl scale-110" />
              <img
                src={heroImage}
                alt="Community helping each other"
                className="relative rounded-3xl shadow-elevated w-full max-w-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-secondary/50">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display text-4xl md:text-5xl font-bold text-foreground"
            >
              Why <span className="gradient-hero bg-clip-text text-transparent">Fazaa</span>?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-muted-foreground max-w-xl mx-auto font-body">
              Built on the Arabian tradition of helping others — strengthening community bonds through technology.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Instant Help", desc: "Post your request and get help from nearby community members within minutes." },
              { icon: MapPin, title: "Location-Based", desc: "See who needs help around you and navigate directly to their location." },
              { icon: MessageCircle, title: "Chat & Call", desc: "Connect with helpers through in-app chat or make a direct phone call." },
              { icon: Shield, title: "Privacy First", desc: "Your data is protected. Information is used only for your benefit." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elevated transition-shadow duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold text-card-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl md:text-5xl font-bold text-foreground">
              How it Works
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Ask for Fazaa", desc: "Tap the + button, describe what you need help with, and share your location.", icon: Plus },
              { step: "02", title: "Community Responds", desc: "Nearby users see your request and can call, chat, or navigate to you.", icon: Users },
              { step: "03", title: "Get Help", desc: "A helper arrives, solves your problem, and strengthens the community bond.", icon: Heart },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-full gradient-accent mx-auto flex items-center justify-center mb-6">
                  <item.icon className="w-8 h-8 text-accent-foreground" />
                </div>
                <span className="font-display text-sm font-bold text-primary tracking-widest">{item.step}</span>
                <h3 className="font-display text-2xl font-bold text-foreground mt-2 mb-3">{item.title}</h3>
                <p className="text-muted-foreground font-body leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Swipe Demo */}
      <section className="py-24 bg-secondary/50">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Swipe to Act
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-muted-foreground font-body">
              Slide right to call or chat, slide left to see location or delete your request.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              { name: "Ahmed", need: "Car broke down on Highway 45", time: "5 min ago" },
              { name: "Sara", need: "Need medicine from pharmacy — urgent", time: "12 min ago" },
              { name: "Omar", need: "Need a calculator for exam tomorrow", time: "20 min ago" },
            ].map((fazaa, i) => (
              <motion.div
                key={fazaa.name}
                variants={fadeUp}
                custom={i}
                className="bg-card rounded-2xl p-6 shadow-card flex items-center justify-between group hover:shadow-elevated transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground font-display font-bold text-lg">{fazaa.name[0]}</span>
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-card-foreground">{fazaa.name}</h4>
                    <p className="text-sm text-muted-foreground font-body">{fazaa.need}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <Phone className="w-4 h-4 text-primary" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <MapPin className="w-4 h-4 text-primary" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground font-body ml-4 flex-shrink-0">{fazaa.time}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24">
        <div className="container max-w-3xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Rooted in Our <span className="gradient-hero bg-clip-text text-transparent">Culture</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-6 text-lg text-muted-foreground font-body leading-relaxed">
              As an Arabian society, helping others runs in our blood. If anyone hears that someone needs help, they won't think twice before making the decision to go help them. Fazaa delivers the call of help to as many people as possible, strengthening the cooperation bonds in our society — which are already strong — more and more.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="gradient-hero rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary-foreground/20 blur-2xl" />
            </div>
            <div className="relative">
              <motion.h2 variants={fadeUp} custom={0} className="font-display text-4xl md:text-5xl font-bold text-primary-foreground">
                Ready to help or be helped?
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="mt-4 text-primary-foreground/80 font-body text-lg max-w-lg mx-auto">
                Join the Fazaa community and make a difference — one act of kindness at a time.
              </motion.p>
              <motion.div variants={fadeUp} custom={2} className="mt-8">
                <Button size="lg" variant="secondary" className="font-display text-base">
                  Join Fazaa Now
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={fazaaLogo} alt="Fazaa" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-foreground">FAZAA</span>
          </div>
          <p className="text-sm text-muted-foreground font-body">© 2026 Fazaa. Strengthening communities together.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
