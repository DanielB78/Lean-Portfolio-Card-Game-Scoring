import { stepToQuarterStage } from '../lib/quarterFlow';

interface QuarterProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function QuarterProgress({ currentStep, totalSteps }: QuarterProgressProps) {
  const segments = Array.from({ length: totalSteps }, (_, index) => {
    const { quarter, stage } = stepToQuarterStage(index);
    const stageLabel = stage === 'prep' ? 'Prep' : 'Review';
    return {
      index,
      quarter,
      stageLabel,
      title: `Quarter ${quarter} · ${stageLabel}`,
    };
  });

  return (
    <div className="quarter-progress" aria-hidden="true">
      <div className="quarter-progress-track">
        {segments.map((segment) => (
          <div
            key={segment.index}
            className={`quarter-progress-segment${
              segment.index < currentStep ? ' quarter-progress-segment-complete' : ''
            }${segment.index === currentStep ? ' quarter-progress-segment-active' : ''}`}
            title={segment.title}
          >
            <span className="quarter-progress-segment-label">
              Q{segment.quarter} {segment.stageLabel.charAt(0)}
            </span>
          </div>
        ))}
      </div>
      <p className="quarter-progress-caption">
        Step {currentStep + 1} of {totalSteps}
      </p>
    </div>
  );
}
