interface RainChartProps {
  rainChance: number[];
}

export default function RainChart({ rainChance }: RainChartProps) {
  const times = ['03 pm', '06 pm', '09 pm', '12 pm', '03 am', '06 am', '09 am', '12 am'];

  return (
    <div className="backdrop-blur-xl bg-white/20 rounded-3xl p-8 shadow-2xl border border-white/30">
      <h3 className="text-xl font-semibold text-white mb-6">Chance of Rain</h3>
      <div className="space-y-3">
        {times.map((time, index) => (
          <div key={time} className="flex items-center gap-4">
            <span className="text-sm text-white/80 w-16">{time}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out animate-slide-in"
                style={{
                  width: `${rainChance[index] || 0}%`,
                  animationDelay: `${index * 100}ms`,
                }}
              ></div>
            </div>
            <span className="text-sm text-white/80 w-12 text-right">{rainChance[index] || 0}%</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
          <span className="text-xs text-white/70">Sunny</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-xs text-white/70">Rainy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-700 rounded-full"></div>
          <span className="text-xs text-white/70">Heavy Rain</span>
        </div>
      </div>
    </div>
  );
}
