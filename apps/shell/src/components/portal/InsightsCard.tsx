"use client";

interface InsightData {
  type: string;
  title: string;
  description: string;
  progress: number;
  progressLabel: string;
  iconClass: string;
  color: string;
  bgColor: string;
}

interface InsightsSectionProps {
  title: string;
  insights: InsightData[];
}

export function InsightsSection({ title, insights }: InsightsSectionProps) {
  return (
    <section className="px-[8%] py-20 bg-[var(--bg-main)]">
      <h2 className="text-[2rem] font-extrabold mb-10 text-center text-[var(--text-main)]">
        Live <span className="text-[var(--primary-green)]">Crop Insights</span>
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-10">
        {insights.map((insight, index) => (
          <div key={index} className="bg-[var(--card-bg)] p-[30px] rounded-[24px] border border-[var(--border-color)] shadow-[var(--shadow-md)] transition-all duration-400 hover:translate-y-[-12px] hover:shadow-[var(--shadow-lg)] hover:border-[var(--primary-green)]">
            <div className="flex justify-between items-center mb-5">
              <i className={`${insight.iconClass} text-[2rem]`} style={{ color: insight.color }}></i>
              <span 
                className="text-[0.8rem] font-extrabold px-3 py-[5px] rounded-[100px]"
                style={{ color: insight.color, backgroundColor: insight.bgColor }}
              >
                {insight.type}
              </span>
            </div>
            <h4 className="text-[1.2rem] mb-[10px] font-bold text-[var(--text-main)]">{insight.title}</h4>
            <p className="text-[0.9rem] text-[var(--text-muted)] mb-5">{insight.description}</p>
            <div className="bg-[var(--bg-secondary)] h-2 rounded-[10px] overflow-hidden">
              <div 
                className="h-full transition-all duration-1000"
                style={{ width: `${insight.progress}%`, backgroundColor: insight.color }}
              ></div>
            </div>
            <p className="text-[0.75rem] mt-2 font-bold text-[var(--text-main)]">{insight.progressLabel}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
