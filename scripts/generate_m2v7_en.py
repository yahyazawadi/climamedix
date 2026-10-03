import json

cues = json.load(open('scripts/m2v7_cues.json', encoding='utf-8'))

translations = [
    # 1: السلام عليكم وأهلا وسهلا فيكم في الفيديو السابع من الموديول الثاني بزمالتنا.
    "Peace be upon you, and welcome to the seventh video of Module Two of our fellowship.",
    # 2: بهذا الشرح، إحنا بدناش نحكي عن أرقام وإحصائيات بيئية ناشفة، إحنا بدنا نغير تفكيرنا جذريا بالمعنى الحقيقي للتغير المناخي.
    "In this session, we won't dwell on dry environmental statistics; we want to radically transform how we understand the true meaning of climate change.",
    # 3: الموضوع أكبر بكتير من مجرد درجات حرارة بتزيد والناس بتقول يا لطيف عالشوب، هاي مسألة بقاء، وصحة عامة بتمس كل واحد فينا.
    "This issue is far bigger than merely rising temperatures with people complaining about the summer heat; this is a matter of survival and public health touching every single one of us.",
    # 4: دايما أول ما نسمع كلمة تغير مناخي
    "Whenever we hear the term 'climate change'...",
    # 5: شو الصورة النمطية اللي بتنط براسنا فورا
    "...what is the instant stereotype that pops into our heads?",
    # 6: صورة شقف التلج عم بتدوب في القطب الشمالي
    "Images of melting ice caps in the Arctic...",
    # 7: ودب أبيض واقف عليها مسكين وزعلان وبفكر كيف بده يرجع عبيته
    "...and a sad, lonely polar bear stranded on an ice floe wondering how to get home.",
    # 8: لعقود طويلة هاي الصور خلت الدكاترة والعملين بالصحة
    "For decades, these visuals led clinicians and healthcare professionals...",
    # 9: يفكروا إنه المناخ قصة بتخص علماء الجيولوجيا والفضاء والنشطاء
    "...to assume climate was strictly a topic for geologists, astrophysicists, and activists...",
    # 10: اللي لابسين كنزات صوف وإنه إحنا شو دخلنا
    "...wearing wool sweaters, leaving us thinking: 'What does this have to do with us?'",
    # 11: بس تعالوا نكسر هاي الصورة تماما
    "Let's shatter this misconception completely.",
    # 12: الواقع اللي بنعيشه مختلف واقرب إلنا بكتير
    "The reality we live is vastly different and hits far closer to home.",
    # 13: الواقع هو موجات شوب خانقة بتضرب حاراتنا
    "The reality is suffocating heatwaves battering our neighborhoods...",
    # 14: شوارع مليانة غبرة وعواصف بتسد النفس
    "...dust-choked streets and suffocating sandstorms...",
    # 15: أقسام الطوارئ بمستشفيات مدننا العربية معبية على الآخر بأطفال وختيارية مش قادرين يتنفسوا
    "...and emergency departments in our Arab cities overflowing with children and seniors struggling to breathe.",
    # 16: منظمة الصحة العالمية ما بتصنف التغير المناخي كمجرد مشكلة بيئية عادية
    "The World Health Organization does not classify climate change as just an ordinary environmental issue...",
    # 17: بل بتعلنه رسميا أكبر مهدد صحي وجودي بتواجه البشرية بالقرن الواحد وعشرين
    "...it officially declares it the greatest existential public health threat facing humanity in the 21st century.",
    # 18: عشان نفهم الصورة كاملة خريطتنا اليوم رح تمشي بخمس محطات رئيسية
    "To grasp the full picture, our roadmap today travels across five major milestones.",
    # 19: خلونا نبدأ بالمحطة الأولى اللي هي أركان الحياة الأربعة
    "Let's begin with Milestone One: The Four Pillars of Life.",
    # 20: صحة الإنسان مش عايشة بفقاعة قزاز معقمة
    "Human health doesn't exist inside a sterile glass bubble.",
    # 21: صحتنا معتمدة كلياً على أربع أركان أساسية بتوفرهم البيئة
    "Our health relies entirely on four foundational pillars provided by the environment:",
    # 22: الهوا اللي بنتنفسه، المي اللي بنشربها، الأكل اللي بنحطه ببطننا، والبيت أو المأوى اللي بيحمينا
    "The air we breathe, the water we drink, the food we consume, and the shelter protecting us.",
    # 23: المشكلة أنه لما النظام المناخي يختل بيضرب هاي الأركان الأربعة
    "The crisis is that when the climate system destabilizes, it strikes all four pillars simultaneously...",
    # 24: وبحول البيئة اللي المفروض تكون مصدر أمان لمصدر مباشر للخطر والمرض والتعب الجسدي
    "...turning the environment that should be a source of safety into a direct conduit of danger, disease, and physical exhaustion.",
    # 25: وهذا بياخدنا للمحطة التانية
    "This brings us to Milestone Two:",
    # 26: تشريح الأزمة المناخية
    "Anatomy of the Climate Crisis:",
    # 27: شو بيصير جوه جسم الإنسان
    "What happens inside the human body?",
    # 28: تعالوا نحط جسمنا تحت المجهر
    "Let's place our body under the microscope.",
    # 29: كل تغير بيئي عنيف بهجم دغري عأجهزة جسمنا
    "Every violent environmental anomaly launches a direct assault on our organ systems:",
    # 30: عالدورة الدموية
    "On the circulatory system...",
    # 31: عالرئتين
    "...on the lungs...",
    # 32: عالهضم
    "...on the digestive tract...",
    # 33: وعالمناعة
    "...and on our immunity.",
    # 34: لو بلشنا بالحرارة القصوى وموجات الشوب
    "Starting with extreme heat and severe heatwaves:",
    # 35: هذا منقدر نسميه القاتل الصامت
    "We can genuinely call this the silent killer.",
    # 36: الجسم بيحاول باستماتة يضل على حرارته الطبيعية 37 درجة
    "The body struggles desperately to maintain its core baseline of 37 degrees Celsius.",
    # 37: فالقلب بيبلش يدق بسرعة جنونية عشان يضخ الدم للجلد ويعرق ويبرد
    "So the heart begins beating frantically to pump blood to the skin, sweat, and cool down...",
    # 38: ويفقد لترات مي وأملاح حيوية
    "...shedding liters of vital fluids and essential electrolytes.",
    # 39: لو ضل التعرض مستمر الجهاز الدفاعي بنهار
    "Under prolonged exposure, this defense mechanism collapses...",
    # 40: وبيدخل الإنسان بإجهاد حراري وممكن ضربة شمس قاتلة يتعطل الدماغ
    "...plunging the person into heat exhaustion or a lethal heat stroke where cerebral function falters.",
    # 41: غير إنه الجفاف الحاد بيركز السموم وبتغط على الكلى لدرجة ممكن تعمل فشل كلوي حاد
    "Moreover, acute dehydration concentrates systemic toxins and strains the kidneys, precipitating acute renal failure.",
    # 42: وعضلة القلب لمرضى الضغط والشرايين ما بتتحمل هالمجهود
    "For hypertensive and cardiovascular patients, the myocardium cannot withstand this strain...",
    # 43: وبتبلش الجلطات والأزمات الصامتة
    "...triggering silent cardiac arrests and vascular crises.",
    # 44: هون الفئات الهشة بتشيل العبء الأكبر
    "Here, vulnerable populations shoulder the heaviest toll:",
    # 45: كبار السن اللي مركز العطش ببالهم بضعف
    "Seniors whose physiological thirst response is impaired...",
    # 46: الأطفال
    "...children...",
    # 47: عمال البناء اللي بالشمس الحارقة بدون أي شبكة أمان أو تكييف
    "...and construction laborers baking under blistering sun without safety nets or cooling.",
    # 48: المشكلة التانية تلوث الهوا وأمراض الصدر
    "The second hazard: Air pollution and respiratory illnesses.",
    # 49: هون المفارقة العجيبة
    "Here lies a striking paradox:",
    # 50: الانبعاثات الكربونية اللي بتسخن الكوكب
    "The very carbon emissions heating our planet...",
    # 51: هي بالضبط اللي بتخنق الرئتين
    "...are the exact toxic emissions suffocating our lungs.",
    # 52: جسيمات دقيقة سامة بتخترق أنسجة الرئة لتوصل لمجرى الدم
    "Fine particulate matter penetrates deep into pulmonary tissue, entering the bloodstream.",
    # 53: ومع ارتفاع الحرارة والعواصف الرملية والغبار اللي بيضرب منطقتنا بانتظام
    "Coupled with scorching temperatures and the seasonal dust storms chronically sweeping our region...",
    # 54: بيصير المزيج قاتل
    "...the mixture turns lethal:",
    # 55: أزمات ربو حادة للأطفال
    "Acute pediatric asthma exacerbations...",
    # 56: انسداد رئوي مزمن
    "...chronic obstructive pulmonary disease (COPD)...",
    # 57: تلف بالشرايين وسكتات دماغية
    "...vascular degeneration, and strokes.",
    # 58: يعني كأنك بتتنفس سم بطيء على الواقف
    "It is akin to inhaling slow-acting poison on a continuous basis.",
    # 59: والظاهرة التالتة الجفاف ونقص الموارد المائية والغذائية
    "The third manifestation: Drought, water depletion, and food insecurity.",
    # 60: موجات الجفاف وتراجع الأمطار مش بس بنشفوا الآبار
    "Severe droughts and declining rainfall don't just desiccate water wells...",
    # 61: هدول بيضربوا المحاصيل الأساسية زي القمح والخضرة
    "...they decimate staple crops like grains, wheat, and vegetables.",
    # 62: فالأسعار بتولع نار بالسوق
    "Market prices skyrocket.",
    # 63: ولما الأسعار تولع والمي تشح
    "And when food costs spike while clean water turns scarce...",
    # 64: الأسر محدودة الدخل بتضطر تشتري أرخص أكل مشبع
    "...low-income households are forced to purchase the cheapest calorie-dense foods...",
    # 65: حتى لو كان فاضي من البروتين والفيتامينات
    "...even if entirely devoid of protein, micronutrients, and vitamins...",
    # 66: وبضطروا يشربوا مي راكدة أو ملوثة
    "...and are driven to consume stagnant or contaminated water.",
    # 67: النتيجة أجيال كاملة من أولادنا بتعاني من التقزم والأنيميا الحادة
    "The result: whole cohorts of children suffering from stunting, severe anemia...",
    # 68: وضعف المناعة والعدوى المعوية الشديدة
    "...compromised immunity, and virulent gastrointestinal infections.",
    # 69: والخطر ما بيوقف هون
    "And the menace doesn't halt there:",
    # 70: خارطة الأمراض المعدية عم تترتب من أول وجديد
    "The epidemiological map of infectious diseases is being entirely redrawn.",
    # 71: ارتفاع الحرارة والرطوبة والفيضانات المفاجئة
    "Escalating heat, humidity, and flash floods...",
    # 72: بتخلق مستنقعات وبيئة خصبة جدا لتكاثر الحشرات
    "...spawn breeding pools and hyper-fertile environments for vectors...",
    # 73: مثل البعوض والجراد والقواقع
    "...such as mosquitoes, ticks, and snails.",
    # 74: النتيجة أنه أمراض زي الملاريا
    "Consequently, pathogens like malaria...",
    # 75: حمى الضنك حمى غرب النيل
    "...dengue fever, West Nile virus...",
    # 76: الليشمانيات عم بتهاجر
    "...and leishmaniasis are migrating...",
    # 77: وبتطلع مناطق جديدة ومدن عمرها ما كانت مسجلة فيها
    "...emerging in new geographical zones and cities where they were never historically registered...",
    # 78: وبتهجم عناس ما عندهمش مناعة سابقة ضدها
    "...infecting populations lacking baseline immunological resistance.",
    # 79: المناخ هون مش هو المايكروب
    "Climate is not the microbe itself...",
    # 80: بس هو البيئة الحاضنة اللي بتنقل الوباء
    "...but it is the hospitable incubator accelerating the epidemic.",
    # 81: وهلأ بننتقل للمحطة التالتة
    "Now we transition to Milestone Three:",
    # 82: ضريبة الصحة النفسية
    "The mental health toll.",
    # 83: بعيداً عن وجع الجسد
    "Beyond physical pathology...",
    # 84: التغير المناخي بيحفر ندوب غائرة بالنفسية
    "...climate disruption carves deep psychological scars.",
    # 85: الكوارثة الطبيعية
    "Natural disasters...",
    # 86: الفيضانات
    "...flash floods...",
    # 87: تلف المحاصيل اللي بيخلي المزارع يخسر لقمة عيش ولاده
    "...and crop failures causing farmers to lose their families' livelihood...",
    # 88: بتفجر حالات الاكتئاب الحاد
    "...ignite waves of major depressive disorder...",
    # 89: واضطراب ما بعد الصدمة
    "...and post-traumatic stress disorder (PTSD).",
    # 90: وفوق هاد طلع مصطلح جديد
    "On top of that, a modern psychiatric concept has emerged:",
    # 91: اسمه القلق المناخي
    "Eco-anxiety (climate anxiety):",
    # 92: خوف مزمن عند الشباب من مستقبل مجهول وكوكب عم بفقد توازنه
    "A chronic dread among youth regarding an uncertain future on a destabilizing planet...",
    # 93: وهذا بفركش التماسك الاجتماعي ورفاهية مجتمعاتنا
    "...eroding social cohesion and collective psychological well-being.",
    # 94: وهون بنوصل للمحطة الرابعة
    "This brings us to Milestone Four:",
    # 95: ليش التغير المناخي قضية صحة عامة بامتياز؟
    "Why is climate change a public health issue par excellence?",
    # 96: لأنه ببساطة بيضرب أعداد هائلة من الناس مش فرد لحاله
    "Because it impacts vast populations rather than isolated individuals...",
    # 97: بعمق اللاعدالة واللامساواة وبضرب الفئات الهشة بالصميم
    "...deepens health inequities, strikes marginalized groups at their core...",
    # 98: وبستنزف المحددات الاجتماعية من سكن ودخل ومي وهوا
    "...and exhausts foundational social determinants: shelter, income, water, and clean air.",
    # 99: وبالتالي بنفعش نواجهه بس بمستشفى وحبة دواء
    "Consequently, it cannot be countered merely with clinic beds and pills.",
    # 100: بده استجابة وقائية استباقية ضخمة وبناء مرونة مجتمعية
    "It demands massive upstream preventive action and civic resilience.",
    # 101: عشان هيك منظومة الصحة العالمية حسمت القصة
    "That is why the WHO made its definitive declaration:",
    # 102: المعركة عشان المناخ هي بالأساس معركة عشان بقاء الإنسان وصحته وعدالته
    "The fight for climate is fundamentally a struggle for human health, survival, and justice.",
    # 103: وبنوصل للمحطة الخامسة قيادة العمل المناخي بتعاطف
    "Finally, Milestone Five: Leading climate action with empathy.",
    # 104: شو دورك كمثقف صحي؟
    "What is your role as a health educator?",
    # 105: بصفتنا صناع أثر وفي زمالتنا دورنا مش نقعد نلقي محاضرات أكاديمية معقدة عن ثقب الأوزون
    "As change-makers in our fellowship, our job isn't lecturing people on the ozone hole...",
    # 106: وتركيز الكربون بالكيلو جرام
    "...or atmospheric parts per million.",
    # 107: الناس مش نقصها فلسفة
    "People do not need detached academic jargon.",
    # 108: دورنا نكون المترجم الأمين
    "Our role is being the trusted translator...",
    # 109: والجسر الإنساني
    "...and the human bridge...",
    # 110: نأخذ هذا العلم ونحوله لرسائل دافية
    "...taking this empirical science and turning it into empathetic...",
    # 111: ومنقذة للحياة
    "...life-saving messaging.",
    # 112: نواعي الأمهات كيف يلبسوا أولادهم كمامات
    "Guiding mothers on fitting masks on their children...",
    # 113: ويحموا صدورهم بعواصف الغبرة
    "...to protect their chests during severe dust storms.",
    # 114: ننبه العمال كيف يحموا حالهم
    "Instructing laborers on shielding themselves...",
    # 115: من ضربة الشمس بكاسة مي وفي
    "...from heat stroke with hydration, shade...",
    # 116: وقت الذروة ونتابع كبار السن
    "...and peak-hour breaks, while monitoring the elderly...",
    # 117: عشان يعدوا أسابيع الشوب
    "...so they navigate scorching heatwaves...",
    # 118: بأمان وسلام
    "...in safety and dignity.",
    # 119: رسالتنا: التغير المناخي
    "Our overarching message: Climate change...",
    # 120: مش قضية بيئية معزولة عن صحتنا
    "...is not an isolated environmental abstraction.",
    # 121: التغير المناخي هو صحة عامة بتمس كل نفس ومية وأكل وعافية بحياتنا اليومية
    "Climate change is public health touching every breath, every sip of water, every meal, and our everyday wellness.",
    # 122: وبالفيديو القادم بدنا نجمع كل هالأدوات والخيوط مع بعض
    "In the next video, we will weave all these tools and threads together...",
    # 123: عشان نرسم ملامح خريطة الطريق التنفيذية
    "...to chart an operational implementation roadmap:",
    # 124: كيف بيقود المثقف الصحي العمل الميداني وصناعة المحتوى المؤثر على الأرض
    "How the health educator orchestrates field initiatives and impactful community communication on the ground.",
    # 125: وقبل ما نختم فكروا معنا
    "Before we conclude, reflect with us:",
    # 126: شو هو الأثر المناخي الأوضح اللي بتلاحظوه بمدينتك وقريتك
    "What is the most tangible climate impact you observe in your city or town?",
    # 127: شوب غبرة ولا شح مي
    "Scorching heat, dust storms, or water scarcity?",
    # 128: ومين أكتر فئة متضررة بجد وكيف بتقدروا كمثقفين تصيغوا رسالة دافية تحميهم وتنقذ حياتهم
    "Who is the most impacted demographic, and how can you craft an empathetic message that protects and saves their lives?",
    # 129: الوعي هو البداية والعمل بتعاطف هو التغيير الحقيقي
    "Awareness is the starting line, and compassionate action is where real change lives.",
    # 130: شكرا لمتابعتكم ونشوفكم بالفيديو الجاي
    "Thank you for watching, and see you in the next video!"
]

assert len(cues) == len(translations), f"Mismatch: {len(cues)} cues vs {len(translations)} translations"

vtt_lines = ["WEBVTT", ""]
for i, cue in enumerate(cues):
    vtt_lines.append(str(cue["num"]))
    vtt_lines.append(cue["time"])
    vtt_lines.append(translations[i])
    vtt_lines.append("")

with open("scripts/subtitles_en/m2v7.vtt", "w", encoding="utf-8") as f:
    f.write("\n".join(vtt_lines))

print(f"Successfully generated m2v7.vtt in English with exactly {len(translations)} cues!")
