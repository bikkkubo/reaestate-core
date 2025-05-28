import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertDealSchema, InsertDeal } from "@shared/schema";
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

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddDealModal({ open, onClose }: AddDealModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertDeal>({
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

  const addDealMutation = useMutation({
    mutationFn: async (data: InsertDeal) => {
      const response = await apiRequest("POST", "/api/deals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "成功",
        description: "新規案件を追加しました",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "案件の追加に失敗しました",
      });
    },
  });

  const onSubmit = (data: InsertDeal) => {
    addDealMutation.mutate(data);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      form.setValue("dueDate", date.toISOString().split('T')[0]);
    }
  };

  // Set default due date to one week from today
  const getDefaultDueDate = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新規案件追加</DialogTitle>
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

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>緊急度 <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>期日 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : getDefaultDueDate()}
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

            <FormField
              control={form.control}
              name="lineUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <i className="fab fa-line text-green-500 mr-1"></i>
                    LINE User ID（任意）
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="顧客のLINE User ID"
                      {...field}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    フェーズ変更時にLINE通知を送信する場合に入力してください
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 取引台帳項目 */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">取引台帳情報</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tenantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>借主名</FormLabel>
                      <FormControl>
                        <Input placeholder="田中太郎" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>契約日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>賃料（円）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="150000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managementFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>管理費（円）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="15000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>敷金（円）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="300000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keyMoney"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>礼金（円）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="150000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brokerage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>仲介手数料（円）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="150000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AD料（円）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="tenantAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>借主住所</FormLabel>
                      <FormControl>
                        <Input placeholder="東京都渋谷区..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="landlordName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>貸主名</FormLabel>
                      <FormControl>
                        <Input placeholder="株式会社..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="landlordAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>貸主住所</FormLabel>
                      <FormControl>
                        <Input placeholder="東京都..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="realEstateAgent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>仲介会社</FormLabel>
                      <FormControl>
                        <Input placeholder="株式会社不動産..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={addDealMutation.isPending}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={addDealMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addDealMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    追加中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-2"></i>
                    案件を追加
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
