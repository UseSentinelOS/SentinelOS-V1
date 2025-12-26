import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Bot, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ElectricButton } from "@/components/terminal/ElectricButton";
import { TerminalWindow } from "@/components/terminal/TerminalWindow";
import { GlitchText } from "@/components/terminal/GlitchText";

const agentFormSchema = z.object({
  name: z.string().min(1, "Agent name is required").max(50),
  description: z.string().max(200).optional(),
  taskType: z.enum([
    "defi_swap",
    "yield_farming",
    "auto_dca",
    "hedging",
    "payment",
    "arbitrage",
    "monitoring",
  ]),
  budgetLimit: z.number().min(0.01).max(1000),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

interface CreateAgentDialogProps {
  onSubmit: (data: AgentFormValues) => void;
  isLoading?: boolean;
}

const taskTypes = [
  { value: "defi_swap", label: "DeFi Swap", description: "Automated token swaps" },
  { value: "yield_farming", label: "Yield Farming", description: "Optimize yield across protocols" },
  { value: "auto_dca", label: "Auto DCA", description: "Dollar cost averaging" },
  { value: "hedging", label: "Hedging", description: "Risk management positions" },
  { value: "payment", label: "Payment", description: "Automated payments" },
  { value: "arbitrage", label: "Arbitrage", description: "Cross-DEX arbitrage" },
  { value: "monitoring", label: "Monitoring", description: "Track & alert on conditions" },
];

export function CreateAgentDialog({ onSubmit, isLoading }: CreateAgentDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      taskType: "defi_swap",
      budgetLimit: 1.0,
    },
  });

  const handleSubmit = (data: AgentFormValues) => {
    onSubmit(data);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ElectricButton
          className="gap-2 font-mono uppercase tracking-wider text-xs"
          data-testid="button-create-agent"
        >
          <Plus className="w-4 h-4" />
          Deploy Agent
        </ElectricButton>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-background border-terminal-purple/30 p-0 overflow-hidden">
        <TerminalWindow title="deploy_new_agent" variant="default">
          <div className="p-6 space-y-6">
            <DialogHeader className="p-0">
              <DialogTitle className="flex items-center gap-2 font-display text-xl">
                <Bot className="w-5 h-5 text-terminal-purple" />
                <GlitchText glitchOnHover glitchOnClick={false}>
                  Deploy New Agent
                </GlitchText>
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">
                        Agent Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-green font-mono text-sm">
                            {">"}
                          </span>
                          <Input
                            {...field}
                            placeholder="my_trading_bot"
                            className="pl-8 font-mono bg-card/50 border-terminal-purple/30 focus:border-terminal-purple"
                            data-testid="input-agent-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">
                        Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe your agent's purpose..."
                          className="font-mono text-sm bg-card/50 border-terminal-purple/30 focus:border-terminal-purple min-h-[80px]"
                          data-testid="input-agent-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taskType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">
                        Task Type
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="font-mono bg-card/50 border-terminal-purple/30"
                            data-testid="select-task-type"
                          >
                            <SelectValue placeholder="Select task type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="font-mono">
                          {taskTypes.map((type) => (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                              className="flex flex-col items-start"
                            >
                              <span>{type.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetLimit"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-mono text-xs uppercase text-muted-foreground">
                          Budget Limit
                        </FormLabel>
                        <span className="font-mono text-sm text-terminal-green">
                          {field.value.toFixed(2)} SOL
                        </span>
                      </div>
                      <FormControl>
                        <div className="space-y-2">
                          <Slider
                            min={0.01}
                            max={10}
                            step={0.01}
                            value={[field.value]}
                            onValueChange={([value]) => field.onChange(value)}
                            className="py-2"
                            data-testid="slider-budget"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground font-mono">
                            <span>0.01 SOL</span>
                            <span>10 SOL</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 flex justify-end gap-3">
                  <ElectricButton
                    type="submit"
                    disabled={isLoading}
                    className="gap-2 font-mono uppercase"
                    data-testid="button-submit-agent"
                  >
                    <Zap className="w-4 h-4" />
                    {isLoading ? "Deploying..." : "Deploy Agent"}
                  </ElectricButton>
                </div>
              </form>
            </Form>
          </div>
        </TerminalWindow>
      </DialogContent>
    </Dialog>
  );
}
