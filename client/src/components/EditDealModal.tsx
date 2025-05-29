import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertDealSchema, Deal, PHASES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ManualLineMessageModal } from "@/components/ManualLineMessageModal";
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
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);

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
        // フォローアップ用項目
        followUpUtilities: deal.followUpUtilities || "false",
        followUpGift: deal.followUpGift || "false",
        followUpOther: deal.followUpOther || "",
        // AD請求/着金用項目
        adAmount: deal.adAmount,
        invoiceDate: deal.invoiceDate || "",
        expectedPaymentDate: deal.expectedPaymentDate || "",
        paymentConfirmed: deal.paymentConfirmed || "false",
        // 取引台帳項目
        dealNumber: deal.dealNumber || "",
        dealType: deal.dealType || "",
        tenantName: deal.tenantName || "",
        tenantAddress: deal.tenantAddress || "",
        contractDate: deal.contractDate || "",
        rentPrice: deal.rentPrice,
        managementFee: deal.managementFee,
        deposit: deal.deposit,
        keyMoney: deal.keyMoney,
        brokerage: deal.brokerage,
        adFee: deal.adFee,
        landlordName: deal.landlordName || "",
        landlordAddress: deal.landlordAddress || "",
        realEstateAgent: deal.realEstateAgent || "",
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
      // タイムゾーン問題を回避するため、現地時間で日付文字列を作成
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      form.setValue("dueDate", `${year}-${month}-${day}`);
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

            {/* フォローアップ用項目 */}
            {deal.phase === "⑩フォローアップ" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-blue-900">フォローアップ項目</h3>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="followUpContractPayment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value === "true"}
                            onChange={(e) => field.onChange(e.target.checked ? "true" : "false")}
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          契約金
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="followUpResidentCard"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value === "true"}
                            onChange={(e) => field.onChange(e.target.checked ? "true" : "false")}
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          住民票
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="followUpMyNumber"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value === "true"}
                            onChange={(e) => field.onChange(e.target.checked ? "true" : "false")}
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          マイナンバー
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="followUpUtilities"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value === "true"}
                            onChange={(e) => field.onChange(e.target.checked ? "true" : "false")}
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          ライフラインの連絡
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="followUpGift"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value === "true"}
                            onChange={(e) => field.onChange(e.target.checked ? "true" : "false")}
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          引っ越し祝い送付
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="followUpOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>その他フォローアップ内容</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="その他の対応があれば入力"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* AD請求/着金用項目 */}
            {deal.phase === "⑪AD請求/着金" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-green-900">AD請求/着金情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>金額</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="金額を入力"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>請求日</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date) => {
                              if (date) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                field.onChange(`${year}-${month}-${day}`);
                              }
                            }}
                            placeholder="請求日を選択"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedPaymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>入金予定日</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date) => {
                              if (date) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                field.onChange(`${year}-${month}-${day}`);
                              }
                            }}
                            placeholder="入金予定日を選択"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentConfirmed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value === "true"}
                            onChange={(e) => field.onChange(e.target.checked ? "true" : "false")}
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          着金確認済み
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* 取引台帳共通項目 */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-purple-900">取引台帳情報</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dealNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>案件番号</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R2025-001"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>取引種別</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="rental"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>借主名</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="借主の氏名"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenantAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>借主住所</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="借主の住所"
                          {...field}
                        />
                      </FormControl>
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
                        <DatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          onDateChange={(date) => {
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              field.onChange(`${year}-${month}-${day}`);
                            }
                          }}
                          placeholder="契約日を選択"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>賃料</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="賃料を入力"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="managementFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>管理費</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="管理費を入力"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>敷金</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="敷金を入力"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="keyMoney"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>礼金</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="礼金を入力"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brokerage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>仲介手数料</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="仲介手数料を入力"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AD料</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="AD料を入力"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
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
                        <Input
                          placeholder="貸主の氏名"
                          {...field}
                        />
                      </FormControl>
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
                        <Input
                          placeholder="貸主の住所"
                          {...field}
                        />
                      </FormControl>
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
                        <Input
                          placeholder="仲介会社名"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <div className="flex items-center space-x-4">
                <span>作成日: {deal.createdAt ? format(new Date(deal.createdAt), "yyyy/MM/dd HH:mm", { locale: ja }) : "未設定"}</span>
                <span>更新日: {deal.updatedAt ? format(new Date(deal.updatedAt), "yyyy/MM/dd HH:mm", { locale: ja }) : "未設定"}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <div className="flex space-x-3">
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

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLineModalOpen(true)}
                  disabled={updateDealMutation.isPending || deleteDealMutation.isPending}
                  className="flex items-center space-x-2 text-green-600 border-green-600 hover:bg-green-50"
                >
                  <i className="fab fa-line text-sm"></i>
                  <span>LINE送信</span>
                </Button>
              </div>

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

        {/* Manual LINE Message Modal */}
        <ManualLineMessageModal
          deal={deal}
          open={isLineModalOpen}
          onClose={() => setIsLineModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}