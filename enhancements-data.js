if (typeof showGallery !== "function") {
  window.gymEnhancements = {
    venues: {
      luma: [8.8, [["29639963", "力量训练区"], ["1954524", "有氧训练区"], ["4162487", "自由训练空间"]]],
      fither: [9.0, [["30021732", "女性训练空间"], ["6456300", "器械训练区"], ["3768916", "基础指导区"]]],
      startfit: [8.6, [["17227606", "综合器械区"], ["1552242", "自由重量区"], ["4162451", "有氧设备区"]]],
      lightgym: [8.3, [["4959807", "基础训练区"], ["4162449", "力量器械区"], ["841130", "自由训练区"]]],
      powerbox: [8.7, [["29639963", "固定器械区"], ["949126", "自由重量区"], ["2261485", "重训空间"]]],
      airfit: [8.2, [["4959807", "24 小时训练区"], ["1954524", "跑步机区域"], ["4162488", "基础力量区"]]]
    },
    catalog: {
      treadmill: ["跑步机", "适合热身、快走和持续有氧", "1954524"],
      elliptical: ["椭圆机", "冲击较低，适合新手有氧", "4162451"],
      bike: ["动感单车", "适合间歇训练和下肢耐力", "4162487"],
      stairClimber: ["登阶机", "偏高强度的下肢有氧训练", "4162488"],
      chestPress: ["坐姿推胸机", "固定轨迹，对新手较友好", "1552242"],
      benchPress: ["卧推架", "适合杠铃卧推和进阶训练", "949126"],
      pecDeck: ["蝴蝶机", "用于胸部夹胸和后束训练", "4162449"],
      cable: ["龙门架", "可完成夹胸、下压等多种动作", "17227606"],
      latPulldown: ["高位下拉机", "适合练习背阔肌发力", "2261485"],
      seatedRow: ["坐姿划船机", "固定轨迹训练中背部", "841130"],
      assistedPullup: ["助力引体机", "降低引体向上的入门难度", "6456300"],
      backExtension: ["罗马椅", "用于下背和后链基础训练", "3768916"]
    },
    inventory: {
      luma: {
        cardio: [["treadmill", "6 台"], ["elliptical", "3 台"], ["bike", "4 台"]],
        chest: [["chestPress", "2 台"], ["benchPress", "2 组"], ["cable", "1 组"]],
        back: [["latPulldown", "2 台"], ["seatedRow", "2 台"], ["assistedPullup", "1 台"]]
      },
      fither: {
        cardio: [["treadmill", "4 台"], ["elliptical", "2 台"], ["bike", "4 台"]],
        chest: [["chestPress", "2 台"], ["pecDeck", "1 台"], ["cable", "1 组"]],
        back: [["latPulldown", "2 台"], ["seatedRow", "1 台"], ["assistedPullup", "1 台"]]
      },
      startfit: {
        cardio: [["treadmill", "10 台"], ["elliptical", "6 台"], ["stairClimber", "2 台"]],
        chest: [["chestPress", "3 台"], ["benchPress", "4 组"], ["pecDeck", "2 台"]],
        back: [["latPulldown", "3 台"], ["seatedRow", "3 台"], ["assistedPullup", "2 台"]]
      },
      lightgym: {
        cardio: [["treadmill", "4 台"], ["elliptical", "2 台"], ["bike", "2 台"]],
        chest: [["chestPress", "1 台"], ["benchPress", "1 组"], ["pecDeck", "1 台"]],
        back: [["latPulldown", "1 台"], ["seatedRow", "1 台"], ["backExtension", "1 台"]]
      },
      powerbox: {
        cardio: [["treadmill", "3 台"], ["bike", "4 台"], ["stairClimber", "1 台"]],
        chest: [["benchPress", "6 组"], ["chestPress", "2 台"], ["cable", "2 组"]],
        back: [["latPulldown", "3 台"], ["seatedRow", "3 台"], ["backExtension", "2 台"]]
      },
      airfit: {
        cardio: [["treadmill", "5 台"], ["elliptical", "2 台"], ["bike", "3 台"]],
        chest: [["chestPress", "1 台"], ["benchPress", "2 组"], ["cable", "1 组"]],
        back: [["latPulldown", "2 台"], ["seatedRow", "1 台"], ["assistedPullup", "1 台"]]
      }
    },
    sections: [
      ["cardio", "有氧", "热身、心肺和耐力训练"],
      ["chest", "胸部", "推举、夹胸和自由重量"],
      ["back", "背部", "下拉、划船和后链训练"]
    ]
  };
}
