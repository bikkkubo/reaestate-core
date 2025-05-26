import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertDealSchema, Deal, PHASES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface EditDealModalProps {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
}

export function EditDealModal({ deal, open, onClose }: EditDealModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertDealSchema),
    defaultValues: {
      title: "",
      client: "",
      priority: "中",
      phase: "①申込連絡",
      dueDate: "",
      notes: "",
    },
  });

  // Reset form when deal changes
  useEffect(() => {
    if (deal) {
      form.reset({
        title: deal.title,
        client: deal.client || "",
        priority: deal.priority,
        phase: deal.phase,
        dueDate: deal.dueDate,
        notes: deal.notes || "",
      });
    }
  }, [deal, form]);

  const updateDealMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!deal) throw new Error("No deal to update");
      const response = await apiRequest("PATCH", `/api/deals/${deal.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "更新完了",
        description: "案件情報を更新しました",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "案件の更新に失敗しました",
      });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async () => {
      if (!deal) throw new Error("No deal to delete");
      const response = await apiRequest("DELETE", `/api/deals/${deal.id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "削除完了",
        description: "案件を削除しました",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "案件の削除に失敗しました",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateDealMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm("この案件を削除してもよろしいですか？")) {
      deleteDealMutation.mutate();
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      form.setValue("dueDate", date.toISOString().split('T')[0]);
    }
  };

  if (!deal) return null;

  const isCompleted = deal.phase === "⑩契約終了";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fas fa-edit text-blue-600"></i>
            <span>案件編集</span>
            {isCompleted && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                完了済み
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>案件名 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例：渋谷区マンション 3LDK"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>顧客名</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例：田中様"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>緊急度 <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="高">高 - 緊急対応が必要</SelectItem>
                        <SelectItem value="中">中 - 通常対応</SelectItem>
                        <SelectItem value="低">低 - 余裕をもって対応</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>フェーズ <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="フェーズを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PHASES.map((phase) => (
                          <SelectItem key={phase} value={phase}>
                            {phase}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>期日 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={handleDateChange}
                      placeholder="期日を選択してください"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メモ（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="追加情報や特記事項があれば入力してください"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <div className="flex items-center space-x-4">
                <span>作成日: {deal.createdAt ? format(new Date(deal.createdAt), "yyyy/MM/dd HH:mm", { locale: ja }) : "未設定"}</span>
                <span>更新日: {deal.updatedAt ? format(new Date(deal.updatedAt), "yyyy/MM/dd HH:mm", { locale: ja }) : "未設定"}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={updateDealMutation.isPending || deleteDealMutation.isPending}
                className="flex items-center space-x-2"
              >
                <i className="fas fa-trash text-sm"></i>
                <span>削除</span>
              </Button>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={updateDealMutation.isPending || deleteDealMutation.isPending}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={updateDealMutation.isPending || deleteDealMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateDealMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      更新中...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      更新
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}