import { getValidators } from "@/data";
import { Validators } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const useGetValidators = () => {
  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["validators"],
    queryFn: getValidators,
    select: ({ data }): Validators => [
      // {
      //   ...mockValidatorData,
      //   name: "vote account 4",
      //   vote_identity: "9wjMBVeCd75CrWS1VXqWmcndBSagVx8tGrX1kWdbLQRW", // dummy pk,
      // },
      // {
      //   ...mockValidatorData,
      //   name: "vote account 5",
      //   vote_identity: "9oNFascoZqtPYhtAfnYTXCdbNUZUEtkrCuDuDpKaAqv", // dummy pk
      // },
      // {
      //   ...mockValidatorData,
      //   name: "vote account 6",
      //   vote_identity: "FkfmXCyGwRfNpaTVYixwssGphP6PnRBDZJWHWurLTvMy", // dummy pk
      // },
      // {
      //   ...mockValidatorData,
      //   name: "vote account 7",
      //   vote_identity: "9QikEprykgKPwB7BenieDYLaeH4iUzfrWooykNBGyDxt", // dummy pk,
      // },
      // {
      //   ...mockValidatorData,
      //   name: "vote account 8",
      //   vote_identity: "8ciJasgK6WvB5qH8eV8Zg8TqgcbfpXwdzfcgbrE9WNGr", // dummy pk
      // },
      // {
      //   ...mockValidatorData,
      //   name: "vote account 9",
      //   vote_identity: "AfWJMp8XcvpWdZ73w7nWiCdZGfpTSBg9UGEGbTy7k8Z1", // dummy pk
      // },
      {
        ...mockValidatorData,
        name: "vote account 1",
        vote_identity: "AHYic562KhgtAEkb1rSesqS87dFYRcfXb4WwWus3Zc9C", // dummy pk,
        image: "https://www.svgrepo.com/show/340131/debug.svg",
        activated_stake: mockValidatorData.activated_stake * 2,
      },
      {
        ...mockValidatorData,
        name: "vote account 2",
        vote_identity: "5WYbFiL3p2vDmFq299Lf236zkUb7VfJafXuaoS5YfV1p", // dummy pk
        image: "https://www.svgrepo.com/show/340131/debug.svg",
        activated_stake: mockValidatorData.activated_stake / 2,
      },
      {
        ...mockValidatorData,
        name: "vote account 3",
        vote_identity: "E5bjdQKxNBLo6DkyDFzD3xCEyF7ZYiXq5YFHuKbo7APu", // dummy pk
        image: "https://www.svgrepo.com/show/340131/debug.svg",
      },
      ...data.slice(0, 1), // TODO: remove this slice
    ],
  });
};

const mockValidatorData = {
  rank: 1068,
  identity: "HEL1USMZKAL2odpNBj2oCjffnFGaYwmbGmyewGv1e2TU",
  vote_identity: "he1iusunGwqrNtafDtLdhsUQDFvo13z9sUa36PauBtk",
  last_vote: 337775448,
  root_slot: 337775417,
  credits: 581945248,
  epoch_credits: 6114922,
  activated_stake: 13795407.942981862,
  version: "2.2.12",
  delinquent: false,
  skip_rate: 0.015243902439024,
  updated_at: "2025-05-04 14:46:30.628618+02",
  first_epoch_with_stake: 595,
  name: "Helius",
  keybase: "",
  description: "Crypto's #1 developer platform. Exclusively on Solana.",
  website: "https://helius.dev",
  commission: 0,
  image:
    "https://media.stakewiz.com/he1iusunGwqrNtafDtLdhsUQDFvo13z9sUa36PauBtk-orange360x360.png",
  ip_latitude: "50.1109221",
  ip_longitude: "8.6821267",
  ip_city: "Frankfurt",
  ip_country: "Germany",
  ip_asn: "AS20326",
  ip_org: "Teraswitch Networks Inc.",
  mod: false,
  is_jito: true,
  jito_commission_bps: 0,
  admin_comment: null,
  vote_success: 99.58,
  vote_success_score: 19.92,
  wiz_skip_rate: 0.015253203172666,
  skip_rate_score: 14.97,
  info_score: 10,
  commission_score: 10,
  first_epoch_distance: 186,
  epoch_distance_score: 10,
  stake_weight: 3.51,
  above_halt_line: true,
  stake_weight_score: 0,
  withdraw_authority_score: 0,
  asn: "AS20326",
  asn_concentration: 18.7,
  asn_concentration_score: -8.13,
  tpu_ip: "64.130.57.131",
  tpu_ip_concentration: 0,
  tpu_ip_concentration_score: 0,
  uptime: 100,
  uptime_score: 20,
  wiz_score: 42.56,
  version_valid: true,
  city_concentration: 21.51,
  city_concentration_score: -8.6,
  invalid_version_score: 0,
  superminority_penalty: -20,
  score_version: 56,
  no_voting_override: false,
  epoch: 781,
  epoch_slot_height: 383481,
  asncity_concentration: 4.46,
  asncity_concentration_score: -5.59,
  skip_rate_ignored: false,
  stake_ratio: 1,
  credit_ratio: 99.7,
  apy_estimate: 7.36,
  staking_apy: 7.39,
  jito_apy: 1.33,
  total_apy: 8.72,
};
